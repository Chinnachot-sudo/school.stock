import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Customer, FamilyMember } from '@/types/inventory';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { requirePermission } from '@/lib/auth-server';

function extractGuardiansAndCleanNote(rawNote?: string | null, parentName?: string | null): {
  guardians?: FamilyMember[];
  cleanNote?: string;
} {
  let guardians: FamilyMember[] | undefined = undefined;
  let cleanNote = rawNote || '';

  if (cleanNote && cleanNote.includes('[GUARDIANS]:')) {
    try {
      const parts = cleanNote.split('\n');
      const gLine = parts.find((p) => p.startsWith('[GUARDIANS]:'));
      if (gLine) {
        guardians = JSON.parse(gLine.replace('[GUARDIANS]:', ''));
        cleanNote = parts.filter((p) => !p.startsWith('[GUARDIANS]:')).join('\n').trim();
      }
    } catch (e) {}
  }

  // Fallback: parse from parentName e.g. "Smith Amornsaensuk (Father), Man Chi Mo (Mother)"
  if (!guardians && parentName && parentName.includes('(') && parentName.includes(')')) {
    try {
      const parts = parentName.split(',').map((s) => s.trim()).filter(Boolean);
      const members: FamilyMember[] = parts.map((p, idx) => {
        const match = p.match(/^(.*?)\s*\((.*?)\)$/);
        if (match) {
          return {
            id: String(idx + 1),
            name: match[1].trim(),
            relationship: (match[2].trim() as any) || 'Other'
          };
        }
        return {
          id: String(idx + 1),
          name: p,
          relationship: 'Other'
        };
      });
      if (members.length > 0) guardians = members;
    } catch (e) {}
  }

  return { guardians, cleanNote: cleanNote || undefined };
}

export async function GET(request: Request) {
  try {
    const authCheck = await requirePermission(request, 'customer:read');
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

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
        let customers: Customer[] = data.map((row: any) => {
          const { guardians, cleanNote } = extractGuardiansAndCleanNote(row.note, row.parent_name);
          return {
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
            guardians,
            points: row.points !== undefined ? Number(row.points) : (120 + ((row.name.charCodeAt(0) || 10) % 8) * 25),
            tier: row.tier || (((row.name.charCodeAt(0) || 10) % 2 === 0) ? 'GOLD' : 'SILVER'),
            note: cleanNote,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          };
        });

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
    const authCheck = await requirePermission(request, 'customer:create');
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const body = await request.json();
    const rawItems: any[] = Array.isArray(body)
      ? body
      : Array.isArray(body.customers)
      ? body.customers
      : [body];

    if (rawItems.length === 0) {
      return NextResponse.json({ error: 'No customer data provided' }, { status: 400 });
    }

    const createdCustomers: Customer[] = [];
    const supabaseRows: any[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];
      const {
        name,
        nickname,
        type = 'STUDENT',
        programme = 'MYP',
        grade,
        studentId,
        parentName,
        phone,
        email,
        note,
        guardians
      } = item;

      const cleanName = (name || '').trim();
      if (!cleanName) {
        if (rawItems.length === 1) {
          return NextResponse.json({ error: 'Customer / Student name is required' }, { status: 400 });
        }
        continue; // skip empty entries in batch
      }

      const cleanNickname = (nickname || '').trim() || undefined;
      const cleanGrade = (grade || '').trim();
      const cleanStudentId = (studentId || '').trim() || undefined;

      let cleanParentName = (parentName || '').trim() || undefined;
      let cleanPhone = (phone || '').trim() || undefined;
      let cleanEmail = (email || '').trim() || undefined;
      let cleanNote = (note || '').trim() || undefined;

      // Process guardians if provided
      let processedGuardians: FamilyMember[] | undefined = undefined;
      if (guardians && Array.isArray(guardians) && guardians.length > 0) {
        const validGuardians = guardians.filter((g: any) => g && g.name && g.name.trim());
        if (validGuardians.length > 0) {
          processedGuardians = validGuardians.map((g: any, idx: number) => ({
            id: g.id || `g-${Date.now()}-${i}-${idx}`,
            name: g.name.trim(),
            relationship: g.relationship || 'Father',
            phone: (g.phone || '').trim() || undefined,
            email: (g.email || '').trim() || undefined
          }));

          cleanParentName = processedGuardians
            .map((g) => `${g.name} (${g.relationship})`)
            .join(', ');

          const firstPhone = processedGuardians.find((g) => g.phone)?.phone;
          const firstEmail = processedGuardians.find((g) => g.email)?.email;
          if (!cleanPhone && firstPhone) cleanPhone = firstPhone;
          if (!cleanEmail && firstEmail) cleanEmail = firstEmail;

          const gTag = `[GUARDIANS]:${JSON.stringify(processedGuardians)}`;
          cleanNote = cleanNote ? `${gTag}\n${cleanNote}` : gTag;
        }
      }

      const customerId = `cust-${Date.now()}-${i}`;

      const newCustomer: Customer = {
        id: customerId,
        name: cleanName,
        nickname: cleanNickname,
        type,
        programme,
        grade: cleanGrade,
        studentId: cleanStudentId,
        parentName: cleanParentName,
        phone: cleanPhone,
        email: cleanEmail,
        guardians: processedGuardians,
        note: cleanNote ? cleanNote.replace(/^\[GUARDIANS\]:.*?\n?/, '') : undefined,
        createdAt: now,
        updatedAt: now
      };

      createdCustomers.push(newCustomer);

      supabaseRows.push({
        id: customerId,
        name: cleanName,
        nickname: cleanNickname || null,
        type,
        programme,
        grade: cleanGrade,
        student_id: cleanStudentId || null,
        parent_name: cleanParentName || null,
        phone: cleanPhone || null,
        email: cleanEmail || null,
        note: cleanNote || null,
        created_at: now,
        updated_at: now
      });
    }

    if (createdCustomers.length === 0) {
      return NextResponse.json({ error: 'No valid customer entries found' }, { status: 400 });
    }

    // 1. Supabase Cloud DB
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('customers').insert(supabaseRows);

      if (error) {
        console.error('Supabase customers insert error:', error);
        let msg = error.message;
        if (msg.includes('relation "customers" does not exist') || msg.includes('does not exist')) {
          msg = 'Table "customers" does not exist in Supabase. Please run the schema SQL script in Supabase SQL Editor.';
        } else if (msg.includes('row-level security') || msg.includes('policy')) {
          msg = 'Supabase Row Level Security (RLS) restriction on "customers" table. Please ensure SUPABASE_SERVICE_ROLE_KEY is configured.';
        }
        return NextResponse.json({ error: msg }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        customer: createdCustomers[0],
        customers: createdCustomers,
        count: createdCustomers.length
      });
    }

    // 2. Local JSON DB Fallback (development only)
    const db = readDb();
    if (!db.customers) db.customers = [];
    db.customers.push(...createdCustomers);
    writeDb(db);

    return NextResponse.json({
      success: true,
      customer: createdCustomers[0],
      customers: createdCustomers,
      count: createdCustomers.length
    });
  } catch (error: any) {
    console.error('Error in POST /api/customers:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create customer' }, { status: 500 });
  }
}
