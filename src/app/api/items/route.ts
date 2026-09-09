import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Item } from '@/types/inventory';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.toLowerCase() || '';
    const categoryId = searchParams.get('categoryId') || '';
    const lowStockOnly = searchParams.get('lowStock') === 'true';

    const db = readDb();
    let items = db.items;

    if (q) {
      items = items.filter(
        item =>
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q)
      );
    }

    if (categoryId) {
      items = items.filter(item => item.categoryId === categoryId);
    }

    if (lowStockOnly) {
      items = items.filter(item => item.currentStock <= item.minStock);
    }

    return NextResponse.json({
      items,
      categories: db.categories,
      departments: db.departments
    });
  } catch (error) {
    console.error('Error in GET /api/items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, categoryId, currentStock, minStock, unit, location, note, isBorrowable } = body;

    if (!code || !name || !unit) {
      return NextResponse.json({ error: 'กรุณากรอกรหัสสินค้า, ชื่อสินค้า และหน่วยนับ' }, { status: 400 });
    }

    const db = readDb();
    
    // Check duplicate code
    const existing = db.items.find(i => i.code.toLowerCase() === code.trim().toLowerCase());
    if (existing) {
      return NextResponse.json({ error: `รหัสสินค้า ${code} มีอยู่ในระบบแล้ว (${existing.name})` }, { status: 400 });
    }

    const newItem: Item = {
      id: `item-${Date.now()}`,
      code: code.trim(),
      name: name.trim(),
      categoryId: categoryId || 'cat-stationery',
      currentStock: Number(currentStock) || 0,
      minStock: Number(minStock) || 5,
      unit: unit.trim(),
      location: (location || 'ตู้พัสดุกลาง').trim(),
      note: (note || '').trim(),
      isBorrowable: Boolean(isBorrowable),
      updatedAt: new Date().toISOString()
    };

    db.items.push(newItem);
    writeDb(db);

    return NextResponse.json({ success: true, item: newItem });
  } catch (error) {
    console.error('Error in POST /api/items:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
