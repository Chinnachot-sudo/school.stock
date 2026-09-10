import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Customer } from '@/types/inventory';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.toLowerCase() || '';
    const programme = searchParams.get('programme');
    const type = searchParams.get('type');

    // 1. Supabase Cloud DB
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('customers').select('*').order('name');
      if (programme && programme !== 'ALL') query = query.eq('programme', programme);
      if (type && type !== 'ALL') query = query.eq('type', type);

      const { data, error } = await query;
      if (!error && data) {
        let customers: Customer[] = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          nickname: row.nickname,
          type: row.type || 'STUDENT',
          programme: row.programme || 'MYP',
          grade: row.grade || '',
          studentId: row.student_id,
          parentName: row.parent_name,
          phone: row.phone,
          email: row.email,
          note: row.note,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));

        if (q) {
          customers = customers.filter(
            c =>
              c.name.toLowerCase().includes(q) ||
              (c.nickname && c.nickname.toLowerCase().includes(q)) ||
              (c.studentId && c.studentId.toLowerCase().includes(q)) ||
              (c.parentName && c.parentName.toLowerCase().includes(q)) ||
              (c.phone && c.phone.includes(q)) ||
              (c.grade && c.grade.toLowerCase().includes(q))
          );
        }

        return NextResponse.json({ customers });
      }
    }

    // 2. Local JSON DB Fallback
    const db = readDb();
    let customers = db.customers || [];

    if (programme && programme !== 'ALL') {
      customers = customers.filter(c => c.programme === programme);
    }
    if (type && type !== 'ALL') {
      customers = customers.filter(c => c.type === type);
    }

    if (q) {
      customers = customers.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          (c.nickname && c.nickname.toLowerCase().includes(q)) ||
          (c.studentId && c.studentId.toLowerCase().includes(q)) ||
          (c.parentName && c.parentName.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.grade && c.grade.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({ customers });
  } catch (error: any) {
    console.error('Error in GET /api/customers:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, nickname = '', type = 'STUDENT', programme = 'MYP', grade = '', studentId = '', parentName = '', phone = '', email = '', note = '' } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อลูกค้า / นักเรียน' }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanNickname = (nickname || '').trim() || undefined;
    const customerId = `cust-${Date.now()}`;
    const now = new Date().toISOString();

    const newCustomer: Customer = {
      id: customerId,
      name: cleanName,
      nickname: cleanNickname,
      type,
      programme,
      grade: grade.trim(),
      studentId: studentId.trim() || undefined,
      parentName: parentName.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      note: note.trim() || undefined,
      createdAt: now,
      updatedAt: now
    };

    // 1. Supabase Cloud DB
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('customers').insert({
        id: customerId,
        name: cleanName,
        nickname: cleanNickname || null,
        type,
        programme,
        grade: grade.trim(),
        student_id: studentId.trim() || null,
        parent_name: parentName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        note: note.trim() || null,
        created_at: now,
        updated_at: now
      }).select().single();

      if (error) {
        console.error('Supabase customers insert error:', error);
        let msg = error.message;
        if (msg.includes('relation "customers" does not exist') || msg.includes('does not exist')) {
          msg = 'ยังไม่มีตาราง "customers" ใน Supabase — กรุณารันสคริปต์ SQL ใน Supabase SQL Editor';
        } else if (msg.includes('row-level security') || msg.includes('policy')) {
          msg = 'ติดสิทธิ์ Row Level Security (RLS) ของ Supabase table "customers" — กรุณารัน SQL ปิด RLS หรือใส่ SUPABASE_SERVICE_ROLE_KEY ใน Vercel';
        }
        return NextResponse.json({ error: msg }, { status: 500 });
      }

      return NextResponse.json({ success: true, customer: newCustomer });
    }

    // 2. Local JSON DB Fallback (development only)
    const db = readDb();
    if (!db.customers) db.customers = [];
    db.customers.push(newCustomer);
    writeDb(db);

    return NextResponse.json({ success: true, customer: newCustomer });
  } catch (error: any) {
    console.error('Error in POST /api/customers:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create customer' }, { status: 500 });
  }
}
