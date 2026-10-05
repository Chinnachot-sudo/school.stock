import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { ReturnRecord, ReturnReason, RETURN_REASON_LABELS } from '@/types/inventory';
import { requireAnyPermission } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const authCheck = await requireAnyPermission(request, ['pos:receipt:refund', 'pos:receipt:void']);
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const body = await request.json();
    const {
      receiptId,
      items, // array of { itemId, itemCode, itemName, quantity, unitPrice, refundAmount }
      reason = 'DEFECTIVE' as ReturnReason,
      reasonDetail = '',
      cashierName = 'Store Cashier'
    } = body;

    const cleanReceiptId = String(receiptId).trim().replace(/[^a-zA-Z0-9_-]/g, '');
    if (!cleanReceiptId) {
      return NextResponse.json({ error: 'Valid Receipt ID or Number is required' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Please select at least 1 item to return' }, { status: 400 });
    }

    const verifiedCashierName = authCheck.user.name || authCheck.user.username || 'Store Cashier';
    const totalRefund = items.reduce((sum: number, it: any) => sum + (Number(it.refundAmount) || (Number(it.unitPrice) * Number(it.quantity))), 0);
    const returnId = `ret-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const reasonLabel = RETURN_REASON_LABELS[reason as ReturnReason] || reason;

    // 1. Supabase Cloud DB (All-in-One Atomic Return & Restock RPC)
    if (isSupabaseConfigured && supabase) {
      const { data: retResult, error: retErr } = await supabase.rpc('process_receipt_return', {
        p_return_id: returnId,
        p_receipt_id: cleanReceiptId,
        p_items: items,
        p_reason: reasonLabel,
        p_reason_detail: reasonDetail || null,
        p_cashier_name: verifiedCashierName
      });

      if (retErr || !retResult || retResult.success === false) {
        throw new Error(retResult?.error || retErr?.message || 'Failed to process return in database');
      }

      const returnRecord: ReturnRecord = {
        id: retResult.returnId || returnId,
        receiptId: retResult.receiptId || cleanReceiptId,
        receiptNumber: retResult.receiptNumber || cleanReceiptId,
        items: retResult.items || items,
        totalRefund: Number(retResult.totalRefund) || totalRefund,
        reason,
        reasonDetail,
        cashierName: verifiedCashierName,
        createdAt: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        message: `Processed return for Receipt #${returnRecord.receiptNumber}. Refund: ฿${returnRecord.totalRefund.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        returnRecord
      });
    }

    // 2. Local JSON DB Fallback
    const db = readDb();
    const receipt = db.receipts?.find(r => r.id === receiptId || r.receiptNumber.toLowerCase() === receiptId.toLowerCase());

    if (!receipt) {
      return NextResponse.json({ error: 'Original receipt not found' }, { status: 404 });
    }

    for (const it of items) {
      const qty = Number(it.quantity) || 1;
      const idx = db.items.findIndex(i => i.id === it.itemId || i.code === it.itemCode);
      if (idx !== -1) {
        db.items[idx].currentStock = (db.items[idx].currentStock || 0) + qty;
        db.items[idx].updatedAt = new Date().toISOString();

        if (!db.transactions) db.transactions = [];
        db.transactions.push({
          id: `tx-ret-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          itemId: db.items[idx].id,
          itemName: db.items[idx].name,
          itemCode: db.items[idx].code,
          type: 'RETURN_RESTOCK',
          quantity: qty,
          balanceAfter: db.items[idx].currentStock,
          department: 'School Store & Co-op',
          requesterName: `Return (Receipt #${receipt.receiptNumber})`,
          note: `Item returned: ${reasonLabel} - ${reasonDetail || 'No remarks'}`,
          receiptId: receipt.id,
          createdAt: new Date().toISOString()
        });
      }
    }

    writeDb(db);

    const returnRecord: ReturnRecord = {
      id: returnId,
      receiptId: receipt.id,
      receiptNumber: receipt.receiptNumber,
      items,
      totalRefund,
      reason,
      reasonDetail,
      cashierName,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: `Processed return for Receipt #${receipt.receiptNumber}. Refund: ฿${totalRefund.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      returnRecord
    });
  } catch (err: any) {
    console.error('Error processing return:', err);
    return NextResponse.json({ error: err.message || 'Internal error processing return' }, { status: 500 });
  }
}
