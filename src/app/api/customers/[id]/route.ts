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
    const { name, type, programme, grade, studentId, parentName, phone, email, note } = body;

    const now = new Date().toISOString();

    // 1. Supabase Cloud DB
    if (isSupabaseConfigured && supabase) {
      const updateData: any = { updated_at: now };
      if (name !== undefined) updateData.name = name.trim();
      if (type !== undefined) updateData.type = type;
      if (programme !== undefined) updateData.programme = programme;
      if (grade !== undefined) updateData.grade = grade.trim();
      if (studentId !== undefined) updateData.student_id = studentId.trim();
      if (parentName !== undefined) updateData.parent_name = parentName.trim();
      if (phone !== undefined) updateData.phone = phone.trim();
      if (email !== undefined) updateData.email = email.trim();
      if (note !== undefined) updateData.note = note.trim();

      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, customer: data });
      }
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
      name: name !== undefined ? name.trim() : current.name,
      type: type !== undefined ? type : current.type,
      programme: programme !== undefined ? programme : current.programme,
      grade: grade !== undefined ? grade.trim() : current.grade,
      studentId: studentId !== undefined ? studentId.trim() : current.studentId,
      parentName: parentName !== undefined ? parentName.trim() : current.parentName,
      phone: phone !== undefined ? phone.trim() : current.phone,
      email: email !== undefined ? email.trim() : current.email,
      note: note !== undefined ? note.trim() : current.note,
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
      await supabase.from('customers').delete().eq('id', id);
    }

    // 2. Local JSON DB
    const db = readDb();
    const index = db.customers?.findIndex(c => c.id === id);
    if (index !== -1 && db.customers) {
      db.customers.splice(index, 1);
      writeDb(db);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete customer' }, { status: 500 });
  }
}
