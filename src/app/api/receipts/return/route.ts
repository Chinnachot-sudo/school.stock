import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { ReturnRecord, ReturnReason, RETURN_REASON_LABELS } from '@/types/inventory';
import { requireAnyPermission } from '@/lib/auth-server';
import { logAuditEvent } from '@/lib/audit';

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
    const requestedTotalRefund = items.reduce((sum: number, it: any) => sum + (Number(it.refundAmount) || (Number(it.unitPrice) * Number(it.quantity))), 0);
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
        totalRefund: Number(retResult.totalRefund) || requestedTotalRefund,
        reason,
        reasonDetail,
        cashierName: verifiedCashierName,
        createdAt: new Date().toISOString()
      };

      await logAuditEvent({ category: 'POS_SALE', action: 'PROCESS_RECEIPT_RETURN', details: `Processed return for receipt ${returnRecord.receiptNumber}`, actorId: authCheck.user.id, actorName: verifiedCashierName, actorEmail: authCheck.user.email, targetId: returnRecord.id, targetName: returnRecord.receiptNumber, metadata: { receiptId: returnRecord.receiptId, totalRefund: returnRecord.totalRefund, reason, itemCount: returnRecord.items.length } });

      return NextResponse.json({
        success: true,
        message: `Processed return for Receipt #${returnRecord.receiptNumber}. Refund: ฿${returnRecord.totalRefund.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        returnRecord
      });
    }

    // 2. Local JSON DB Fallback
    const db = readDb();
    const receipt = db.receipts?.find(r => r.id === cleanReceiptId || r.receiptNumber.toLowerCase() === cleanReceiptId.toLowerCase());

    if (!receipt) {
      return NextResponse.json({ error: 'Original receipt not found' }, { status: 404 });
    }

    if (receipt.status === 'VOIDED') {
      return NextResponse.json({ error: 'Cannot return items from a voided receipt' }, { status: 409 });
    }

    const aggregated = new Map<string, number>();
    for (const requested of items) {
      const key = String(requested.itemId || requested.itemCode || '').trim();
      const qty = Number(requested.quantity);
      if (!key || !Number.isInteger(qty) || qty <= 0) {
        return NextResponse.json({ error: 'Every returned item must have a valid positive whole-number quantity' }, { status: 400 });
      }
      aggregated.set(key, (aggregated.get(key) || 0) + qty);
    }

    if (!Array.isArray(db.transactions)) db.transactions = [];
    const validatedItems: ReturnRecord['items'] = [];
    for (const [key, qty] of aggregated) {
      const original = receipt.items.find(line => line.itemId === key || line.itemCode === key);
      if (!original) {
        return NextResponse.json({ error: `Item ${key} was not sold on this receipt` }, { status: 400 });
      }

      const previouslyReturned = (db.transactions || [])
        .filter(tx => tx.type === 'RETURN_RESTOCK' && tx.receiptId === receipt.id && tx.itemId === original.itemId)
        .reduce((sum, tx) => sum + Number(tx.quantity || 0), 0);
      const remaining = Number(original.quantity) - previouslyReturned;
      if (qty > remaining) {
        return NextResponse.json(
          { error: `Cannot return ${qty} of ${original.itemName}; only ${Math.max(remaining, 0)} remain returnable` },
          { status: 409 }
        );
      }

      const inventoryIndex = db.items.findIndex(i => i.id === original.itemId || i.code === original.itemCode);
      if (inventoryIndex === -1) {
        return NextResponse.json({ error: `Inventory item ${original.itemCode} no longer exists` }, { status: 409 });
      }

      validatedItems.push({
        itemId: original.itemId,
        itemCode: original.itemCode,
        itemName: original.itemName,
        quantity: qty,
        unitPrice: Number(original.unitPrice),
        refundAmount: qty * Number(original.unitPrice)
      });
    }

    const totalRefund = validatedItems.reduce((sum, item) => sum + item.refundAmount, 0);
    const now = new Date().toISOString();
    for (const returned of validatedItems) {
      const idx = db.items.findIndex(i => i.id === returned.itemId || i.code === returned.itemCode);
      db.items[idx].currentStock = (db.items[idx].currentStock || 0) + returned.quantity;
      db.items[idx].updatedAt = now;
      db.transactions.push({
        id: `tx-ret-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        itemId: db.items[idx].id,
        itemName: db.items[idx].name,
        itemCode: db.items[idx].code,
        type: 'RETURN_RESTOCK',
        quantity: returned.quantity,
        balanceAfter: db.items[idx].currentStock,
        department: 'School Store & Co-op',
        requesterName: `Return (Receipt #${receipt.receiptNumber})`,
        note: `Item returned: ${reasonLabel} - ${reasonDetail || 'No remarks'}`,
        receiptId: receipt.id,
        createdAt: now
      });
    }
    writeDb(db);

    await logAuditEvent({ category: 'POS_SALE', action: 'PROCESS_RECEIPT_RETURN', details: `Processed return for receipt ${receipt.receiptNumber}`, actorId: authCheck.user.id, actorName: verifiedCashierName, actorEmail: authCheck.user.email, targetId: returnId, targetName: receipt.receiptNumber, metadata: { receiptId: receipt.id, totalRefund, reason, itemCount: validatedItems.length } });

    const returnRecord: ReturnRecord = {
      id: returnId,
      receiptId: receipt.id,
      receiptNumber: receipt.receiptNumber,
      items: validatedItems,
      totalRefund,
      reason,
      reasonDetail,
      cashierName: verifiedCashierName,
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
