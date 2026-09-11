import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, nickname, type, programme, grade, studentId, parentName, phone, email, note } = body;

    const now = new Date().toISOString();

    // 1. Supabase Cloud DB
    if (isSupabaseConfigured && supabase) {
      const updateData: any = { updated_at: now };
      if (name !== undefined) updateData.name = (name || '').trim();
      if (nickname !== undefined) updateData.nickname = (nickname || '').trim() || null;
      if (type !== undefined) updateData.type = type;
      if (programme !== undefined) updateData.programme = programme;
      if (grade !== undefined) updateData.grade = (grade || '').trim();
      if (studentId !== undefined) updateData.student_id = (studentId || '').trim() || null;
      if (parentName !== undefined) updateData.parent_name = (parentName || '').trim() || null;
      if (phone !== undefined) updateData.phone = (phone || '').trim() || null;
      if (email !== undefined) updateData.email = (email || '').trim() || null;
      if (note !== undefined) updateData.note = (note || '').trim() || null;

      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        let msg = error.message;
        if (msg.includes('row-level security') || msg.includes('policy')) {
          msg = 'ติดสิทธิ์ Row Level Security (RLS) ของ Supabase table "customers" — กรุณารัน SQL ปิด RLS หรือใส่ SUPABASE_SERVICE_ROLE_KEY ใน Vercel';
        }
        return NextResponse.json({ error: msg }, { status: 500 });
      }

      return NextResponse.json({ success: true, customer: data });
    }

    // 2. Local JSON DB
    const db = readDb();
    const index = db.customers?.findIndex(c => c.id === id);
    if (index === -1 || !db.customers) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลลูกค้ารายนี้' }, { status: 404 });
    }

    const current = db.customers[index];
    db.customers[index] = {
      ...current,
      name: name !== undefined ? (name || '').trim() : current.name,
      nickname: nickname !== undefined ? (nickname || '').trim() || undefined : current.nickname,
      type: type !== undefined ? type : current.type,
      programme: programme !== undefined ? programme : current.programme,
      grade: grade !== undefined ? (grade || '').trim() : current.grade,
      studentId: studentId !== undefined ? (studentId || '').trim() || undefined : current.studentId,
      parentName: parentName !== undefined ? (parentName || '').trim() || undefined : current.parentName,
      phone: phone !== undefined ? (phone || '').trim() || undefined : current.phone,
      email: email !== undefined ? (email || '').trim() || undefined : current.email,
      note: note !== undefined ? (note || '').trim() || undefined : current.note,
      updatedAt: now
    };

    writeDb(db);
    return NextResponse.json({ success: true, customer: db.customers[index] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update customer' }, { status: 500 });
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
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        let msg = error.message;
        if (msg.includes('row-level security') || msg.includes('policy')) {
          msg = 'ติดสิทธิ์ Row Level Security (RLS) ของ Supabase table "customers" — กรุณารัน SQL ปิด RLS หรือใส่ SUPABASE_SERVICE_ROLE_KEY ใน Vercel';
        }
        return NextResponse.json({ error: msg }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // 2. Local JSON DB
    const db = readDb();
    if (db.customers) {
      db.customers = db.customers.filter(c => c.id !== id);
      writeDb(db);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete customer' }, { status: 500 });
  }
}
