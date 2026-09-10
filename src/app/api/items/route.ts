import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Item } from '@/types/inventory';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.toLowerCase() || '';
    const categoryId = searchParams.get('categoryId') || '';
    const lowStockOnly = searchParams.get('lowStock') === 'true';

    // 1. If Supabase Cloud DB is configured
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('items').select('*').order('name');
      if (categoryId) query = query.eq('category_id', categoryId);

      const [itemsRes, catRes, deptRes] = await Promise.all([
        query,
        supabase.from('categories').select('*').order('name'),
        supabase.from('departments').select('*').order('name')
      ]);

      if (itemsRes.error) throw itemsRes.error;

      let items: Item[] = (itemsRes.data || []).map((row: any) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        categoryId: row.category_id,
        currentStock: row.current_stock,
        minStock: row.min_stock,
        unit: row.unit,
        location: row.location || '',
        price: row.price !== undefined && row.price !== null ? Number(row.price) : 0,
        cost: row.cost !== undefined && row.cost !== null ? Number(row.cost) : 0,
        isForSale: Boolean(row.is_for_sale),
        note: row.note || '',
        isBorrowable: row.is_borrowable,
        updatedAt: row.updated_at
      }));

      if (q) {
        items = items.filter(
          item =>
            item.name.toLowerCase().includes(q) ||
            item.code.toLowerCase().includes(q) ||
            item.location.toLowerCase().includes(q)
        );
      }

      if (lowStockOnly) {
        items = items.filter(item => item.currentStock <= item.minStock);
      }

      return NextResponse.json({
        items,
        categories: catRes.data || [],
        departments: deptRes.data || []
      });
    }

    // 2. Fallback to Local JSON DB
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
    const { code, name, categoryId, currentStock, minStock, unit, location, note, isBorrowable, price, cost, isForSale } = body;

    if (!code || !name || !unit) {
      return NextResponse.json({ error: 'กรุณากรอกรหัสสินค้า, ชื่อสินค้า และหน่วยนับ' }, { status: 400 });
    }

    const trimmedCode = code.trim();
    const trimmedName = name.trim();

    // 1. Supabase Cloud DB
    if (isSupabaseConfigured && supabase) {
      const { data: existing } = await supabase
        .from('items')
        .select('id, name')
        .ilike('code', trimmedCode)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: `รหัสสินค้า ${trimmedCode} มีอยู่ในระบบแล้ว (${existing.name})` },
          { status: 400 }
        );
      }

      const newItemData: any = {
        id: `item-${Date.now()}`,
        code: trimmedCode,
        name: trimmedName,
        category_id: categoryId || 'cat-stationery',
        current_stock: Number(currentStock) || 0,
        min_stock: Number(minStock) || 5,
        unit: unit.trim(),
        location: (location || 'ตู้พัสดุกลาง').trim(),
        price: Number(price) || 0,
        cost: Number(cost) || 0,
        is_for_sale: Boolean(isForSale),
        note: (note || '').trim(),
        is_borrowable: Boolean(isBorrowable),
        updated_at: new Date().toISOString()
      };

      let insertRes = await supabase.from('items').insert(newItemData).select().single();
      if (insertRes.error && insertRes.error.message?.includes('column')) {
        delete newItemData.price;
        delete newItemData.cost;
        delete newItemData.is_for_sale;
        insertRes = await supabase.from('items').insert(newItemData).select().single();
      }

      if (insertRes.error) throw insertRes.error;
      const data = insertRes.data;

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
          price: data.price !== undefined ? Number(data.price) : Number(price) || 0,
          cost: data.cost !== undefined ? Number(data.cost) : Number(cost) || 0,
          isForSale: data.is_for_sale !== undefined ? Boolean(data.is_for_sale) : Boolean(isForSale),
          note: data.note,
          isBorrowable: data.is_borrowable,
          updatedAt: data.updated_at
        }
      });
    }

    // 2. Local JSON DB Fallback
    const db = readDb();
    const existing = db.items.find(i => i.code.toLowerCase() === trimmedCode.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: `รหัสสินค้า ${code} มีอยู่ในระบบแล้ว (${existing.name})` }, { status: 400 });
    }

    const newItem: Item = {
      id: `item-${Date.now()}`,
      code: trimmedCode,
      name: trimmedName,
      categoryId: categoryId || 'cat-stationery',
      currentStock: Number(currentStock) || 0,
      minStock: Number(minStock) || 5,
      unit: unit.trim(),
      location: (location || 'ตู้พัสดุกลาง').trim(),
      price: Number(price) || 0,
      cost: Number(cost) || 0,
      isForSale: Boolean(isForSale),
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
