import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { ReturnRecord, ReturnReason, RETURN_REASON_LABELS } from '@/types/inventory';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      receiptId,
      items, // array of { itemId, itemCode, itemName, quantity, unitPrice, refundAmount }
      reason = 'DEFECTIVE' as ReturnReason,
      reasonDetail = '',
      cashierName = 'Store Cashier'
    } = body;

    if (!receiptId) {
      return NextResponse.json({ error: 'Receipt ID or Number is required' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Please select at least 1 item to return' }, { status: 400 });
    }

    const totalRefund = items.reduce((sum: number, it: any) => sum + (Number(it.refundAmount) || (Number(it.unitPrice) * Number(it.quantity))), 0);
    const returnId = `ret-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const reasonLabel = RETURN_REASON_LABELS[reason as ReturnReason] || reason;

    // 1. Supabase Cloud DB
    if (isSupabaseConfigured && supabase) {
      const { data: receipt } = await supabase
        .from('receipts')
        .select('*')
        .or(`id.eq.${receiptId},receipt_number.eq.${receiptId}`)
        .maybeSingle();

      if (!receipt) {
        return NextResponse.json({ error: 'Original receipt not found' }, { status: 404 });
      }

      // Restock items in Supabase
      for (const it of items) {
        const qty = Number(it.quantity) || 1;
        const { data: curItem } = await supabase
          .from('items')
          .select('current_stock, name, code')
          .eq('id', it.itemId)
          .maybeSingle();

        if (curItem) {
          const newStock = (curItem.current_stock || 0) + qty;
          await supabase
            .from('items')
            .update({ current_stock: newStock, updated_at: new Date().toISOString() })
            .eq('id', it.itemId);

          await supabase.from('transactions').insert({
            id: `tx-ret-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            item_id: it.itemId,
            item_name: curItem.name || it.itemName,
            item_code: curItem.code || it.itemCode,
            type: 'RETURN_RESTOCK',
            quantity: qty,
            balance_after: newStock,
            department: 'School Store & Co-op',
            requester_name: `Return (Receipt #${receipt.receipt_number})`,
            note: `Item returned & restocked: ${reasonLabel} - ${reasonDetail || 'No remarks'}`,
            receipt_id: receipt.id,
            created_at: new Date().toISOString()
          });
        }
      }

      const returnRecord: ReturnRecord = {
        id: returnId,
        receiptId: receipt.id,
        receiptNumber: receipt.receipt_number,
        items,
        totalRefund,
        reason,
        reasonDetail,
        cashierName,
        createdAt: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        message: `Processed return for Receipt #${receipt.receipt_number}. Refund: ฿${totalRefund.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
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
