import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, icon, description } = body;

    // 1. Supabase Cloud DB
    if (isSupabaseConfigured && supabase) {
      const updateData: any = {};
      if (name) updateData.name = name.trim();
      if (icon) updateData.icon = icon.trim();

      const { data, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, category: data });
    }

    // 2. Local JSON DB
    const db = readDb();
    const index = db.categories.findIndex(c => c.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'ไม่พบหมวดหมู่นี้' }, { status: 404 });
    }

    db.categories[index] = {
      ...db.categories[index],
      name: name !== undefined ? name.trim() : db.categories[index].name,
      icon: icon !== undefined ? icon.trim() : db.categories[index].icon,
      description: description !== undefined ? description.trim() : db.categories[index].description
    };

    writeDb(db);
    return NextResponse.json({ success: true, category: db.categories[index] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Supabase Cloud DB
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) {
        // If items are referencing this category
        if (error.message?.includes('violates foreign key')) {
          return NextResponse.json(
            { error: 'ไม่สามารถลบหมวดหมู่นี้ได้เนื่องจากมีสินค้าที่ผูกกับหมวดหมู่นี้อยู่ กรุณาย้ายหมวดหมู่ของสินค้าก่อน' },
            { status: 400 }
          );
        }
        throw error;
      }
      return NextResponse.json({ success: true });
    }

    // 2. Local JSON DB
    const db = readDb();
    const index = db.categories.findIndex(c => c.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'ไม่พบหมวดหมู่' }, { status: 404 });
    }

    const itemsUsing = db.items.filter(i => i.categoryId === id);
    if (itemsUsing.length > 0) {
      return NextResponse.json(
        { error: `ไม่สามารถลบได้เนื่องจากมีสินค้า ${itemsUsing.length} รายการผูกกับหมวดหมู่นี้อยู่` },
        { status: 400 }
      );
    }

    db.categories.splice(index, 1);
    writeDb(db);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 500 });
  }
}
