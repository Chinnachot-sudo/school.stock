import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Transaction, TransactionType } from '@/types/inventory';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { logAuditEvent } from '@/lib/audit';
import { requirePermission } from '@/lib/auth-server';

export async function GET(request: Request) {
  try {
    const authCheck = await requirePermission(request, 'inventory:item:read');
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

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
        quantity: Number(row.quantity) || 0,
        balanceAfter: Number(row.balance_after) || 0,
        department: row.department,
        departmentId: row.department_id,
        issuedToUserId: row.issued_to_user_id,
        issuedToName: row.issued_to_name,
        unitCost: Number(row.unit_cost) || 0,
        totalCost: Number(row.total_cost) || 0,
        budgetDeducted: Boolean(row.budget_deducted),
        requesterName: row.requester_name,
        note: row.note,
        createdAt: row.created_at
      }));

      return NextResponse.json({
        transactions,
        total: transactions.length
      });
    }

    // Offline / local development fallback
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
    console.error('Failed to fetch transactions:', error);
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

    // Validate quantities
    for (const item of itemsToProcess) {
      if (isNaN(item.quantity) || (type !== 'ADJUST' && item.quantity <= 0) || (type === 'ADJUST' && item.quantity < 0)) {
        return NextResponse.json({ error: `Invalid quantity for item ID ${item.itemId}` }, { status: 400 });
      }
    }

    // Permission Guard based on transaction type
    const requiredPermission =
      type === 'IN'
        ? 'inventory:stock:restock'
        : type === 'OUT'
        ? 'inventory:stock:issue'
        : 'inventory:item:update';

    const authCheck = await requirePermission(request, requiredPermission as any);
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const now = new Date().toISOString();

    // =========================================================================
    // CASE A: Supabase Production Single Source of Truth
    // =========================================================================
    if (isSupabaseConfigured && supabase) {
      const itemIdentifiers = itemsToProcess.map(it => it.itemId);
      const { data: dbItems, error: itemsErr } = await supabase
        .from('items')
        .select('*')
        .in('id', itemIdentifiers);

      if (itemsErr || !dbItems || dbItems.length === 0) {
        return NextResponse.json({ error: 'Could not fetch items from database' }, { status: 400 });
      }

      // Check all items exist
      for (const reqItem of itemsToProcess) {
        const found = dbItems.find((i: any) => i.id === reqItem.itemId || i.code === reqItem.itemId);
        if (!found) {
          return NextResponse.json({ error: `Item ${reqItem.itemId} not found` }, { status: 404 });
        }
      }

      // Pre-check stock for OUT operations
      let totalBatchCost = 0;
      for (const reqItem of itemsToProcess) {
        const found = dbItems.find((i: any) => i.id === reqItem.itemId || i.code === reqItem.itemId)!;
        const currentStock = Number(found.current_stock) || 0;
        const itemCost = reqItem.unitCost !== undefined ? reqItem.unitCost : Number(found.cost ?? found.price ?? 0);
        totalBatchCost += reqItem.quantity * itemCost;

        if (type === 'OUT' && currentStock < reqItem.quantity) {
          return NextResponse.json(
            {
              error: `Insufficient stock for "${found.name}"! Available: ${currentStock} ${found.unit || 'pcs'}, Requested: ${reqItem.quantity} ${found.unit || 'pcs'}`
            },
            { status: 400 }
          );
        }
      }

      // Check Department Budget if OUT
      let targetDept: any = null;
      let budgetDeducted = false;

      if (type === 'OUT' && (departmentId || department)) {
        try {
          let deptQuery = supabase.from('departments').select('*');
          if (departmentId) {
            deptQuery = deptQuery.eq('id', departmentId);
          } else if (department && department !== 'ALL') {
            deptQuery = deptQuery.eq('name', department);
          }
          const { data: deptData } = await deptQuery.maybeSingle();
          if (deptData) {
            targetDept = {
              id: deptData.id,
              name: deptData.name,
              allocatedBudget: Number(deptData.allocated_budget || deptData.allocatedBudget) || 0,
              spentBudget: Number(deptData.spent_budget || deptData.spentBudget) || 0
            };

            const remaining = targetDept.allocatedBudget - targetDept.spentBudget;
            if (totalBatchCost > remaining && !overrideBudget) {
              return NextResponse.json(
                {
                  error: `Department budget exceeded! Available: ฿${remaining.toLocaleString()}, Requisition Total: ฿${totalBatchCost.toLocaleString()}`,
                  budgetExceeded: true,
                  allocatedBudget: targetDept.allocatedBudget,
                  spentBudget: targetDept.spentBudget,
                  remainingBudget: remaining,
                  requiredBudget: totalBatchCost
                },
                { status: 400 }
              );
            }

            // Deduct department budget
            await supabase
              .from('departments')
              .update({ spent_budget: targetDept.spentBudget + totalBatchCost, updated_at: now })
              .eq('id', targetDept.id);
            budgetDeducted = true;
          }
        } catch (deptErr) {
          console.warn('Department budget check warning:', deptErr);
        }
      }

      // Execute Atomic Stock Movement Batch RPC (All-in-one Single DB Transaction)
      const { data: rpcResult, error: rpcErr } = await supabase.rpc('create_stock_movement_batch', {
        p_type: type,
        p_items: itemsToProcess.map(it => {
          const found = dbItems.find((i: any) => i.id === it.itemId || i.code === it.itemId)!;
          return {
            itemId: found.id,
            quantity: it.quantity,
            unitCost: it.unitCost !== undefined ? it.unitCost : Number(found.cost ?? found.price ?? 0),
            itemCode: found.code,
            itemName: found.name
          };
        }),
        p_metadata: {
          department: (targetDept ? targetDept.name : (department || 'General Academic Dept')).trim(),
          departmentId: targetDept ? targetDept.id : departmentId || null,
          issuedToUserId: issuedToUserId || null,
          issuedToName: issuedToName || requesterName || null,
          requesterName: (requesterName || issuedToName || '').trim(),
          note: (note || '').trim(),
          budgetDeducted
        }
      });

      if (rpcErr || !rpcResult || rpcResult.success === false) {
        throw new Error(rpcResult?.error || rpcErr?.message || 'Failed to process stock movement in database');
      }

      const createdTxs: Transaction[] = (rpcResult.transactions || []).map((t: any) => ({
        id: t.id,
        itemId: t.itemId,
        itemName: t.itemName,
        itemCode: t.itemCode,
        type: t.type,
        quantity: t.quantity,
        balanceAfter: t.balanceAfter,
        department: t.department,
        departmentId: targetDept ? targetDept.id : departmentId,
        issuedToUserId,
        issuedToName: issuedToName || requesterName,
        requesterName: (requesterName || issuedToName || '').trim(),
        unitCost: itemsToProcess.find(it => it.itemId === t.itemId)?.unitCost || 0,
        totalCost: (itemsToProcess.find(it => it.itemId === t.itemId)?.quantity || 0) * (itemsToProcess.find(it => it.itemId === t.itemId)?.unitCost || 0),
        budgetDeducted,
        note: (note || '').trim(),
        createdAt: t.createdAt || now
      }));

      // Server-side verified Audit Log
      const actor = (authCheck.user.name || authCheck.user.username || requesterName || issuedToName || 'Inventory Staff').trim();
      const actorEmail = authCheck.user.email || undefined;
      const actionName = type === 'IN' ? 'RECEIVE_STOCK' : type === 'OUT' ? 'ISSUE_STOCK' : 'ADJUST_STOCK';
      const itemsSummary = createdTxs.map(t => `${t.itemName} (${type === 'OUT' ? '-' : '+'}${t.quantity})`).join(', ');

      logAuditEvent({
        category: 'STOCK_OPERATION',
        action: actionName,
        details: `${type === 'IN' ? 'Received stock' : type === 'OUT' ? 'Issued stock' : 'Adjusted stock'}: ${itemsSummary} | Dept: ${department || 'Central'}`,
        actorName: actor,
        actorEmail,
        targetId: createdTxs[0]?.id,
        targetName: createdTxs.length === 1 ? createdTxs[0]?.itemName : `${createdTxs.length} items`,
        metadata: {
          type,
          count: createdTxs.length,
          totalCost: totalBatchCost,
          items: createdTxs.map(t => ({ id: t.itemId, code: t.itemCode, qty: t.quantity }))
        }
      }).catch(e => console.warn('Audit log error:', e));

      return NextResponse.json({
        success: true,
        count: createdTxs.length,
        transactions: createdTxs,
        transaction: createdTxs[0],
        totalCost: totalBatchCost,
        department: targetDept,
        remainingBudget: targetDept ? (targetDept.allocatedBudget - targetDept.spentBudget) : undefined
      });
    }

    // =========================================================================
    // CASE B: Offline Local JSON Fallback Mode
    // =========================================================================
    const db = readDb();
    const itemRecords: Array<{ index: number; item: any; qty: number; unitCost: number }> = [];
    let totalBatchCost = 0;

    for (const entry of itemsToProcess) {
      const { itemId: itId, quantity: qty } = entry;
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

        targetDept.spentBudget = spent + totalBatchCost;
        budgetDeducted = true;
      }
    }

    const createdTxs: Transaction[] = [];

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

    const actor = (authCheck.user.name || authCheck.user.username || requesterName || issuedToName || 'Inventory Staff').trim();
    const actorEmail = authCheck.user.email || undefined;
    const actionName = type === 'IN' ? 'RECEIVE_STOCK' : type === 'OUT' ? 'ISSUE_STOCK' : 'ADJUST_STOCK';
    const itemsSummary = createdTxs.map(t => `${t.itemName} (${type === 'OUT' ? '-' : '+'}${t.quantity})`).join(', ');

    logAuditEvent({
      category: 'STOCK_OPERATION',
      action: actionName,
      details: `${type === 'IN' ? 'Received stock' : type === 'OUT' ? 'Issued stock' : 'Adjusted stock'}: ${itemsSummary} | Dept: ${department || 'Central'}`,
      actorName: actor,
      actorEmail,
      targetId: createdTxs[0]?.id,
      targetName: createdTxs.length === 1 ? createdTxs[0]?.itemName : `${createdTxs.length} items`,
      metadata: {
        type,
        count: createdTxs.length,
        totalCost: totalBatchCost,
        items: createdTxs.map(t => ({ id: t.itemId, code: t.itemCode, qty: t.quantity }))
      }
    }).catch(e => console.warn('Audit log error:', e));

    return NextResponse.json({
      success: true,
      count: createdTxs.length,
      transactions: createdTxs,
      transaction: createdTxs[0],
      updatedItem: db.items[itemRecords[0]?.index],
      totalCost: totalBatchCost,
      department: targetDept,
      remainingBudget: targetDept ? ((targetDept.allocatedBudget ?? 0) - (targetDept.spentBudget ?? 0)) : undefined
    });
  } catch (error) {
    console.error('Error processing transaction:', error);
    return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 });
  }
}
