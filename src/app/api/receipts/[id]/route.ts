import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Receipt, Transaction } from '@/types/inventory';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Supabase
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .or(`id.eq.${id},receipt_number.eq.${id}`)
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
    const found = db.receipts?.find(r => r.id === id || r.receiptNumber.toLowerCase() === id.toLowerCase());

    if (!found) {
      return NextResponse.json({ error: 'ไม่พบใบเสร็จรับเงินนี้' }, { status: 404 });
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
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const voidReason = body.reason || 'ยกเลิกรายการโดยผู้ดูแลระบบ';

    const db = readDb();
    const index = db.receipts?.findIndex(r => r.id === id || r.receiptNumber.toLowerCase() === id.toLowerCase());

    if (index === -1 || !db.receipts) {
      return NextResponse.json({ error: 'ไม่พบใบเสร็จรับเงิน' }, { status: 404 });
    }

    const receipt = db.receipts[index];
    if (receipt.status === 'VOIDED') {
      return NextResponse.json({ error: 'ใบเสร็จนี้ถูกยกเลิกไปแล้ว' }, { status: 400 });
    }

    // 1. Mark receipt as VOIDED
    receipt.status = 'VOIDED';
    receipt.voidReason = voidReason;

    // 2. Restore stock for all items in local DB
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
          department: 'ร้านค้าสวัสดิการ / สหกรณ์',
          requesterName: 'ระบบ (ยกเลิกบิล)',
          note: `คืนสต็อกเนื่องจากยกเลิกใบเสร็จ #${receipt.receiptNumber} (${voidReason})`,
          receiptId: receipt.id,
          createdAt: new Date().toISOString()
        };
        db.transactions.push(voidTx);
      }
    }

    writeDb(db);

    // 3. Sync void to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('receipts')
          .update({ status: 'VOIDED', void_reason: voidReason })
          .eq('id', receipt.id);

        for (const item of receipt.items) {
          const { data: cur } = await supabase.from('items').select('current_stock').eq('id', item.itemId).single();
          if (cur) {
            const restoredStock = cur.current_stock + item.quantity;
            await supabase.from('items').update({ current_stock: restoredStock }).eq('id', item.itemId);
          }
        }
      } catch (e) {
        console.warn('Supabase void sync error:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: `ยกเลิกใบเสร็จ #${receipt.receiptNumber} และคืนยอดสต็อกเรียบร้อยแล้ว`,
      receipt
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to void receipt' }, { status: 500 });
  }
}
