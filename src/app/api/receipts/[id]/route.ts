import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Receipt, ReceiptItem, Transaction } from '@/types/inventory';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { requirePermission } from '@/lib/auth-server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requirePermission(request, 'pos:receipt:read');
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const { id } = await params;
    const cleanId = (id || '').trim().replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!cleanId) {
      return NextResponse.json({ error: 'Valid receipt ID or number is required' }, { status: 400 });
    }

    // 1. Supabase
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .or(`id.eq.${cleanId},receipt_number.eq.${cleanId}`)
        .maybeSingle();

      if (!error && data) {
        const receipt: Receipt = {
          id: data.id,
          receiptNumber: data.receipt_number,
          customerName: data.customer_name,
          customerType: data.customer_type,
          studentClass: data.student_class,
          studentId: data.student_id,
          paymentMethod: data.payment_method,
          items: typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || []),
          subtotal: Number(data.subtotal) || 0,
          discount: Number(data.discount) || 0,
          totalAmount: Number(data.total_amount) || 0,
          cashReceived: Number(data.cash_received) || 0,
          change: Number(data.change) || 0,
          cashierName: data.cashier_name,
          cashierEmail: data.cashier_email,
          note: data.note,
          status: data.status || 'COMPLETED',
          voidReason: data.void_reason,
          createdAt: data.created_at
        };
        return NextResponse.json({ receipt });
      }
    }

    // 2. Local JSON DB
    const db = readDb();
    const found = db.receipts?.find(r => r.id === cleanId || r.receiptNumber.toLowerCase() === cleanId.toLowerCase());

    if (!found) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    return NextResponse.json({ receipt: found });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch receipt' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requirePermission(request, 'pos:receipt:void');
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const { id } = await params;
    const cleanId = (id || '').trim().replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!cleanId) {
      return NextResponse.json({ error: 'Valid receipt ID or number is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const voidReason = body.reason || 'Cancelled by administrator';

    // 1. Supabase Cloud DB (All-in-One Atomic Void & Restock RPC)
    if (isSupabaseConfigured && supabase) {
      const { data: voidResult, error: voidErr } = await supabase.rpc('void_receipt_with_stock_restore', {
        p_receipt_id: cleanId,
        p_void_reason: voidReason
      });

      if (voidErr || !voidResult || voidResult.success === false) {
        throw new Error(voidResult?.error || voidErr?.message || 'Failed to void receipt in database');
      }

      return NextResponse.json({
        success: true,
        message: `Receipt #${voidResult.receiptNumber || cleanId} voided and inventory restored successfully.`,
        receiptId: voidResult.receiptId
      });
    }

    // 2. Local JSON DB Fallback
    const db = readDb();
    const index = db.receipts?.findIndex(r => r.id === id || r.receiptNumber.toLowerCase() === id.toLowerCase());

    if (index === -1 || !db.receipts) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    const receipt = db.receipts[index];
    if (receipt.status === 'VOIDED') {
      return NextResponse.json({ error: 'This receipt has already been voided' }, { status: 400 });
    }

    receipt.status = 'VOIDED';
    receipt.voidReason = voidReason;

    for (const item of receipt.items) {
      const itemIdx = db.items.findIndex(i => i.id === item.itemId);
      if (itemIdx !== -1) {
        db.items[itemIdx].currentStock += item.quantity;
        db.items[itemIdx].updatedAt = new Date().toISOString();

        const voidTx: Transaction = {
          id: `tx-void-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          itemId: item.itemId,
          itemName: item.itemName,
          itemCode: item.itemCode,
          type: 'VOID_SALE',
          quantity: item.quantity,
          balanceAfter: db.items[itemIdx].currentStock,
          department: 'School Store & Co-op',
          requesterName: 'System (Void Transaction)',
          note: `Restocked due to voided receipt #${receipt.receiptNumber} (${voidReason})`,
          receiptId: receipt.id,
          createdAt: new Date().toISOString()
        };
        db.transactions.push(voidTx);
      }
    }

    writeDb(db);

    return NextResponse.json({
      success: true,
      message: `Receipt #${receipt.receiptNumber} voided and inventory restored successfully.`,
      receipt
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to void receipt' }, { status: 500 });
  }
}
