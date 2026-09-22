import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Transaction, TransactionType } from '@/types/inventory';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const type = searchParams.get('type') as TransactionType | null;
    const department = searchParams.get('department');
    const itemId = searchParams.get('itemId');

    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('transactions').select('*').order('created_at', { ascending: false });

      if (type) query = query.eq('type', type);
      if (department && department !== 'ALL') query = query.eq('department', department);
      if (itemId) query = query.eq('item_id', itemId);

      const { data, error } = await query.limit(limit);
      if (error) throw error;

      const transactions: Transaction[] = (data || []).map((row: any) => ({
        id: row.id,
        itemId: row.item_id,
        itemName: row.item_name,
        itemCode: row.item_code,
        type: row.type,
        quantity: row.quantity,
        balanceAfter: row.balance_after,
        department: row.department,
        departmentId: row.department_id,
        issuedToUserId: row.issued_to_user_id,
        issuedToName: row.issued_to_name,
        unitCost: row.unit_cost,
        totalCost: row.total_cost,
        budgetDeducted: row.budget_deducted,
        requesterName: row.requester_name,
        note: row.note,
        createdAt: row.created_at
      }));

      return NextResponse.json({
        transactions,
        total: transactions.length
      });
    }

    const db = readDb();
    let logs = [...db.transactions].reverse();

    if (type) logs = logs.filter(l => l.type === type);
    if (department && department !== 'ALL') logs = logs.filter(l => l.department === department);
    if (itemId) logs = logs.filter(l => l.itemId === itemId);

    return NextResponse.json({
      transactions: logs.slice(0, limit),
      total: logs.length
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      itemId,
      type,
      quantity,
      department,
      departmentId,
      requesterName,
      issuedToUserId,
      issuedToName,
      unitCost,
      note,
      items: rawItems,
      overrideBudget
    } = body;

    // Normalize items to array: [{ itemId, quantity, unitCost }]
    let itemsToProcess: Array<{ itemId: string; quantity: number; unitCost?: number }> = [];

    if (Array.isArray(rawItems) && rawItems.length > 0) {
      itemsToProcess = rawItems.map(it => ({
        itemId: String(it.itemId || it.id),
        quantity: Number(it.quantity),
        unitCost: it.unitCost !== undefined ? Number(it.unitCost) : undefined
      }));
    } else if (itemId && quantity) {
      itemsToProcess = [{
        itemId: String(itemId),
        quantity: Number(quantity),
        unitCost: unitCost !== undefined ? Number(unitCost) : undefined
      }];
    }

    if (itemsToProcess.length === 0 || !type) {
      return NextResponse.json({ error: 'Incomplete information or no items provided' }, { status: 400 });
    }

    const db = readDb();

    // 1. Validate all items exist and have enough stock if OUT
    const itemRecords: Array<{ index: number; item: any; qty: number; unitCost: number }> = [];
    let totalBatchCost = 0;

    for (const entry of itemsToProcess) {
      const { itemId: itId, quantity: qty } = entry;
      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json({ error: `Invalid quantity for item: ${itId}` }, { status: 400 });
      }

      const itemIndex = db.items.findIndex(
        i => i.id === itId || i.code.toLowerCase() === itId.toLowerCase()
      );

      if (itemIndex === -1) {
        return NextResponse.json({ error: `Item ${itId} not found in system` }, { status: 404 });
      }

      const item = db.items[itemIndex];
      if (type === 'OUT' && item.currentStock < qty) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${item.name}"! Available: ${item.currentStock} ${item.unit}, Requested: ${qty} ${item.unit}`
          },
          { status: 400 }
        );
      }

      const cost = entry.unitCost !== undefined ? entry.unitCost : (item.cost ?? item.price ?? 0);
      totalBatchCost += qty * cost;

      itemRecords.push({
        index: itemIndex,
        item,
        qty,
        unitCost: cost
      });
    }

    // 2. Budget Check for OUT transactions if departmentId or department is specified
    let targetDept: any = null;
    let budgetDeducted = false;

    if (type === 'OUT') {
      if (departmentId) {
        targetDept = (db.departments || []).find(d => d.id === departmentId);
      } else if (department && department !== 'ALL') {
        targetDept = (db.departments || []).find(
          d => d.name.toLowerCase() === department.toLowerCase() || d.id === department
        );
      }

      if (targetDept) {
        const allocated = targetDept.allocatedBudget ?? 0;
        const spent = targetDept.spentBudget ?? 0;
        const remaining = allocated - spent;

        if (totalBatchCost > remaining && !overrideBudget) {
          return NextResponse.json(
            {
              error: `Department budget exceeded! Available: ฿${remaining.toLocaleString()}, Requisition Total: ฿${totalBatchCost.toLocaleString()}`,
              budgetExceeded: true,
              allocatedBudget: allocated,
              spentBudget: spent,
              remainingBudget: remaining,
              requiredBudget: totalBatchCost
            },
            { status: 400 }
          );
        }

        // Deduct from budget
        targetDept.spentBudget = spent + totalBatchCost;
        budgetDeducted = true;
      }
    }

    // 3. Apply stock updates and record transactions
    const createdTxs: Transaction[] = [];
    const now = new Date().toISOString();

    for (const record of itemRecords) {
      const { index, item, qty, unitCost: itemCost } = record;
      let newStock = item.currentStock;

      if (type === 'OUT') {
        newStock -= qty;
      } else if (type === 'IN') {
        newStock += qty;
      } else if (type === 'ADJUST') {
        newStock = qty;
      }

      item.currentStock = newStock;
      item.updatedAt = now;
      db.items[index] = item;

      const newTx: Transaction = {
        id: `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        itemId: item.id,
        itemName: item.name,
        itemCode: item.code,
        type: type as TransactionType,
        quantity: qty,
        balanceAfter: newStock,
        department: (targetDept ? targetDept.name : (department || 'General Academic Dept')).trim(),
        departmentId: targetDept ? targetDept.id : departmentId,
        issuedToUserId,
        issuedToName: issuedToName || requesterName,
        requesterName: (requesterName || issuedToName || '').trim(),
        unitCost: itemCost,
        totalCost: qty * itemCost,
        budgetDeducted,
        note: (note || '').trim(),
        createdAt: now
      };

      createdTxs.push(newTx);
      db.transactions.push(newTx);
    }

    writeDb(db);

    return NextResponse.json({
      success: true,
      count: createdTxs.length,
      transactions: createdTxs,
      transaction: createdTxs[0], // for backwards compatibility
      totalCost: totalBatchCost,
      department: targetDept,
      remainingBudget: targetDept ? ((targetDept.allocatedBudget ?? 0) - (targetDept.spentBudget ?? 0)) : undefined
    });
  } catch (error) {
    console.error('Error processing transaction:', error);
    return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 });
  }
}
