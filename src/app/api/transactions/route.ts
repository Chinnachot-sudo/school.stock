import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Transaction, TransactionType } from '@/types/inventory';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const type = searchParams.get('type') as TransactionType | null;
    const department = searchParams.get('department');
    const itemId = searchParams.get('itemId');

    const db = readDb();
    let logs = [...db.transactions].reverse(); // newest first

    if (type) {
      logs = logs.filter(l => l.type === type);
    }
    if (department) {
      logs = logs.filter(l => l.department === department);
    }
    if (itemId) {
      logs = logs.filter(l => l.itemId === itemId);
    }

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
      newStock = qty; // In adjust mode, qty is the target count
    } else {
      return NextResponse.json({ error: 'ประเภทการทำรายการไม่ถูกต้อง' }, { status: 400 });
    }

    item.currentStock = newStock;
    item.updatedAt = new Date().toISOString();

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
