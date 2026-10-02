import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { requirePermission } from '@/lib/auth-server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requirePermission(request, 'customer:update');
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const { id } = await params;
    const body = await request.json();
    const { name, nickname, type, programme, grade, studentId, parentName, phone, email, note, guardians } = body;

    const now = new Date().toISOString();

    let cleanParentName = parentName !== undefined ? (parentName || '').trim() || null : undefined;
    let cleanPhone = phone !== undefined ? (phone || '').trim() || null : undefined;
    let cleanEmail = email !== undefined ? (email || '').trim() || null : undefined;
    let cleanNote = note !== undefined ? (note || '').trim() || null : undefined;

    // Process guardians if provided
    let processedGuardians: any[] | undefined = undefined;
    if (guardians !== undefined && Array.isArray(guardians)) {
      const validGuardians = guardians.filter((g: any) => g && g.name && g.name.trim());
      processedGuardians = validGuardians.map((g: any, idx: number) => ({
        id: g.id || `g-${Date.now()}-${idx}`,
        name: g.name.trim(),
        relationship: g.relationship || 'Father',
        phone: (g.phone || '').trim() || undefined,
        email: (g.email || '').trim() || undefined
      }));

      cleanParentName = processedGuardians
        .map((g) => `${g.name} (${g.relationship})`)
        .join(', ') || null;

      const firstPhone = processedGuardians.find((g) => g.phone)?.phone;
      const firstEmail = processedGuardians.find((g) => g.email)?.email;
      if (!cleanPhone && firstPhone) cleanPhone = firstPhone;
      if (!cleanEmail && firstEmail) cleanEmail = firstEmail;

      const gTag = `[GUARDIANS]:${JSON.stringify(processedGuardians)}`;
      cleanNote = cleanNote ? `${gTag}\n${cleanNote}` : gTag;
    }

    // 1. Supabase Cloud DB
    if (isSupabaseConfigured && supabase) {
      const updateData: any = { updated_at: now };
      if (name !== undefined) updateData.name = (name || '').trim();
      if (nickname !== undefined) updateData.nickname = (nickname || '').trim() || null;
      if (type !== undefined) updateData.type = type;
      if (programme !== undefined) updateData.programme = programme;
      if (grade !== undefined) updateData.grade = (grade || '').trim();
      if (studentId !== undefined) updateData.student_id = (studentId || '').trim() || null;
      if (cleanParentName !== undefined) updateData.parent_name = cleanParentName;
      if (cleanPhone !== undefined) updateData.phone = cleanPhone;
      if (cleanEmail !== undefined) updateData.email = cleanEmail;
      if (cleanNote !== undefined) updateData.note = cleanNote;

      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        let msg = error.message;
        if (msg.includes('row-level security') || msg.includes('policy')) {
          msg = 'Supabase Row Level Security (RLS) restriction on "customers" table. Please ensure SUPABASE_SERVICE_ROLE_KEY is configured.';
        }
        return NextResponse.json({ error: msg }, { status: 500 });
      }

      return NextResponse.json({ success: true, customer: data });
    }

    // 2. Local JSON DB
    const db = readDb();
    const index = db.customers?.findIndex(c => c.id === id);
    if (index === -1 || !db.customers) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
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
      parentName: cleanParentName !== undefined ? (cleanParentName || undefined) : current.parentName,
      phone: cleanPhone !== undefined ? (cleanPhone || undefined) : current.phone,
      email: cleanEmail !== undefined ? (cleanEmail || undefined) : current.email,
      guardians: processedGuardians !== undefined ? processedGuardians : current.guardians,
      note: cleanNote !== undefined ? (cleanNote || undefined) : current.note,
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
    const authCheck = await requirePermission(request, 'customer:delete');
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

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
          msg = 'Supabase Row Level Security (RLS) restriction on "customers" table. Please ensure SUPABASE_SERVICE_ROLE_KEY is configured.';
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
