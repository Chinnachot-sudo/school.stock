import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = readDb();
    const item = db.items.find(i => i.id === id || i.code.toLowerCase() === id.toLowerCase());

    if (!item) {
      return NextResponse.json({ error: 'ไม่พบสินค้านี้' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = readDb();

    const index = db.items.findIndex(i => i.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'ไม่พบสินค้าที่ต้องการแก้ไข' }, { status: 404 });
    }

    const current = db.items[index];
    db.items[index] = {
      ...current,
      name: body.name !== undefined ? body.name.trim() : current.name,
      code: body.code !== undefined ? body.code.trim() : current.code,
      categoryId: body.categoryId || current.categoryId,
      minStock: body.minStock !== undefined ? Number(body.minStock) : current.minStock,
      unit: body.unit !== undefined ? body.unit.trim() : current.unit,
      location: body.location !== undefined ? body.location.trim() : current.location,
      note: body.note !== undefined ? body.note.trim() : current.note,
      isBorrowable: body.isBorrowable !== undefined ? Boolean(body.isBorrowable) : current.isBorrowable,
      updatedAt: new Date().toISOString()
    };

    writeDb(db);
    return NextResponse.json({ success: true, item: db.items[index] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = readDb();
    const index = db.items.findIndex(i => i.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    }

    db.items.splice(index, 1);
    writeDb(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
