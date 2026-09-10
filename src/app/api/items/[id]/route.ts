import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .or(`id.eq.${id},code.eq.${id}`)
        .maybeSingle();

      if (error || !data) {
        return NextResponse.json({ error: 'ไม่พบสินค้านี้' }, { status: 404 });
      }

      return NextResponse.json({
        item: {
          id: data.id,
          code: data.code,
          name: data.name,
          categoryId: data.category_id,
          currentStock: data.current_stock,
          minStock: data.min_stock,
          unit: data.unit,
          location: data.location,
          price: data.price !== undefined && data.price !== null ? Number(data.price) : 0,
          cost: data.cost !== undefined && data.cost !== null ? Number(data.cost) : 0,
          isForSale: Boolean(data.is_for_sale),
          note: data.note,
          isBorrowable: data.is_borrowable,
          updatedAt: data.updated_at
        }
      });
    }

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

    if (isSupabaseConfigured && supabase) {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      if (body.name !== undefined) updateData.name = body.name.trim();
      if (body.code !== undefined) updateData.code = body.code.trim();
      if (body.categoryId !== undefined) updateData.category_id = body.categoryId;
      if (body.minStock !== undefined) updateData.min_stock = Number(body.minStock);
      if (body.unit !== undefined) updateData.unit = body.unit.trim();
      if (body.location !== undefined) updateData.location = body.location.trim();
      if (body.price !== undefined) updateData.price = Number(body.price);
      if (body.cost !== undefined) updateData.cost = Number(body.cost);
      if (body.isForSale !== undefined) updateData.is_for_sale = Boolean(body.isForSale);
      if (body.note !== undefined) updateData.note = body.note.trim();
      if (body.isBorrowable !== undefined) updateData.is_borrowable = Boolean(body.isBorrowable);

      let updateRes = await supabase
        .from('items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateRes.error && updateRes.error.message?.includes('column')) {
        delete updateData.price;
        delete updateData.cost;
        delete updateData.is_for_sale;
        updateRes = await supabase
          .from('items')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
      }

      if (updateRes.error) throw updateRes.error;
      const data = updateRes.data;

      return NextResponse.json({
        success: true,
        item: {
          id: data.id,
          code: data.code,
          name: data.name,
          categoryId: data.category_id,
          currentStock: data.current_stock,
          minStock: data.min_stock,
          unit: data.unit,
          location: data.location,
          price: data.price !== undefined ? Number(data.price) : body.price !== undefined ? Number(body.price) : 0,
          cost: data.cost !== undefined ? Number(data.cost) : body.cost !== undefined ? Number(body.cost) : 0,
          isForSale: data.is_for_sale !== undefined ? Boolean(data.is_for_sale) : Boolean(body.isForSale),
          note: data.note,
          isBorrowable: data.is_borrowable,
          updatedAt: data.updated_at
        }
      });
    }

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
      price: body.price !== undefined ? Number(body.price) : current.price,
      cost: body.cost !== undefined ? Number(body.cost) : current.cost,
      isForSale: body.isForSale !== undefined ? Boolean(body.isForSale) : current.isForSale,
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

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

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
