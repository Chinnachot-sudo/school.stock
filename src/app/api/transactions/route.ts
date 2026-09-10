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
    const { itemId, type, quantity, department, requesterName, note } = body;

    const qty = Number(quantity);
    if (!itemId || !type || isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน หรือจำนวนไม่ถูกต้อง' }, { status: 400 });
    }

    // 1. Supabase Cloud DB
    if (isSupabaseConfigured && supabase) {
      // Find item
      const { data: item, error: fetchErr } = await supabase
        .from('items')
        .select('*')
        .or(`id.eq.${itemId},code.eq.${itemId}`)
        .single();

      if (fetchErr || !item) {
        return NextResponse.json({ error: 'ไม่พบสินค้าในระบบ' }, { status: 404 });
      }

      let newStock = item.current_stock;
      if (type === 'OUT') {
        if (item.current_stock < qty) {
          return NextResponse.json(
            {
              error: `ยอดสต็อกไม่พอตัด! คงเหลือเพียง ${item.current_stock} ${item.unit} แต่ต้องการเบิก ${qty} ${item.unit}`
            },
            { status: 400 }
          );
        }
        newStock -= qty;
      } else if (type === 'IN') {
        newStock += qty;
      } else if (type === 'ADJUST') {
        newStock = qty;
      } else {
        return NextResponse.json({ error: 'ประเภทการทำรายการไม่ถูกต้อง' }, { status: 400 });
      }

      // Update item stock
      const { error: updateErr } = await supabase
        .from('items')
        .update({
          current_stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (updateErr) throw updateErr;

      // Log transaction
      const newTxId = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const { error: txErr } = await supabase.from('transactions').insert({
        id: newTxId,
        item_id: item.id,
        item_name: item.name,
        item_code: item.code,
        type,
        quantity: qty,
        balance_after: newStock,
        department: (department || 'กลุ่มสาระฯ ทั่วไป').trim(),
        requester_name: (requesterName || '').trim(),
        note: (note || '').trim(),
        created_at: new Date().toISOString()
      });

      if (txErr) throw txErr;

      return NextResponse.json({
        success: true,
        updatedItem: {
          id: item.id,
          code: item.code,
          name: item.name,
          categoryId: item.category_id,
          currentStock: newStock,
          minStock: item.min_stock,
          unit: item.unit,
          location: item.location,
          note: item.note,
          isBorrowable: item.is_borrowable
        },
        isLowStock: newStock <= item.min_stock
      });
    }

    // 2. Local JSON DB Fallback
    const db = readDb();
    const itemIndex = db.items.findIndex(
      i => i.id === itemId || i.code.toLowerCase() === itemId.toString().toLowerCase()
    );

    if (itemIndex === -1) {
      return NextResponse.json({ error: 'ไม่พบสินค้าในระบบ' }, { status: 404 });
    }

    const item = db.items[itemIndex];
    let newStock = item.currentStock;

    if (type === 'OUT') {
      if (item.currentStock < qty) {
        return NextResponse.json(
          {
            error: `ยอดสต็อกไม่พอตัด! คงเหลือเพียง ${item.currentStock} ${item.unit} แต่ต้องการเบิก ${qty} ${item.unit}`
          },
          { status: 400 }
        );
      }
      newStock -= qty;
    } else if (type === 'IN') {
      newStock += qty;
    } else if (type === 'ADJUST') {
      newStock = qty;
    } else {
      return NextResponse.json({ error: 'ประเภทการทำรายการไม่ถูกต้อง' }, { status: 400 });
    }

    item.currentStock = newStock;
    item.updatedAt = new Date().toISOString() as any;

    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemId: item.id,
      itemName: item.name,
      itemCode: item.code,
      type: type as TransactionType,
      quantity: qty,
      balanceAfter: newStock,
      department: (department || 'กลุ่มสาระฯ ทั่วไป').trim(),
      requesterName: (requesterName || '').trim(),
      note: (note || '').trim(),
      createdAt: new Date().toISOString()
    };

    db.transactions.push(newTx);
    writeDb(db);

    return NextResponse.json({
      success: true,
      transaction: newTx,
      updatedItem: item,
      isLowStock: newStock <= item.minStock
    });
  } catch (error) {
    console.error('Error processing transaction:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการทำรายการ' }, { status: 500 });
  }
}
