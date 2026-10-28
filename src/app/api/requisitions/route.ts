import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-server';
import { isServiceRoleConfigured, supabaseAdmin } from '@/lib/supabase';
import { logAuditEvent } from '@/lib/audit';

function unavailable() {
  return NextResponse.json({ error: 'Supabase server access is not configured.' }, { status: 503 });
}

export async function GET(request: Request) {
  const auth = await requirePermission(request, 'request:read:own');
  if (auth.errorResponse) return auth.errorResponse;
  if (!isServiceRoleConfigured || !supabaseAdmin) return unavailable();

  try {
    const { data, error } = await supabaseAdmin
      .from('requisitions')
      .select('*')
      .eq('requester_id', auth.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const requests = (data || []).map((row: any) => ({
      id: row.id,
      itemName: row.item_name,
      qty: row.quantity,
      unit: row.unit,
      department: row.department_name || '',
      status: row.status === 'ISSUED' ? 'RECEIVED' : row.status,
      createdAt: row.created_at,
      purpose: row.purpose || ''
    }));
    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Failed to load requisitions:', error);
    return NextResponse.json({ error: 'Unable to load your requests from Supabase.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requirePermission(request, 'request:create');
  if (auth.errorResponse) return auth.errorResponse;
  if (!isServiceRoleConfigured || !supabaseAdmin) return unavailable();

  try {
    const body = await request.json();
    const itemId = typeof body.itemId === 'string' ? body.itemId.trim() : '';
    const quantity = Number(body.quantity);
    const departmentId = typeof body.departmentId === 'string' ? body.departmentId.trim() : '';
    const purpose = typeof body.purpose === 'string' ? body.purpose.trim().slice(0, 2000) : '';

    if (!itemId || !Number.isSafeInteger(quantity) || quantity < 1) {
      return NextResponse.json({ error: 'Choose an item and enter a quantity of at least 1.' }, { status: 400 });
    }

    const { data: item, error: itemError } = await supabaseAdmin
      .from('items')
      .select('id, code, name, unit')
      .eq('id', itemId)
      .maybeSingle();
    if (itemError) throw itemError;
    if (!item) return NextResponse.json({ error: 'The selected item no longer exists in Supabase.' }, { status: 400 });

    let departmentName: string | null = null;
    if (departmentId) {
      const { data: department, error: departmentError } = await supabaseAdmin
        .from('departments')
        .select('id, name')
        .eq('id', departmentId)
        .maybeSingle();
      if (departmentError) throw departmentError;
      if (!department) return NextResponse.json({ error: 'The selected department no longer exists in Supabase.' }, { status: 400 });
      departmentName = department.name;
    }

    const row = {
      id: randomUUID(),
      item_id: item.id,
      item_code: item.code,
      item_name: item.name,
      unit: item.unit,
      quantity,
      department_id: departmentId || null,
      department_name: departmentName,
      purpose: purpose || null,
      requester_id: auth.user.id,
      requester_name: auth.user.name || auth.user.username,
      status: 'PENDING'
    };

    const { data, error } = await supabaseAdmin.from('requisitions').insert(row).select('*').single();
    if (error) throw error;
    await logAuditEvent({ category: 'STOCK_OPERATION', action: 'CREATE_REQUISITION', details: `Requested ${quantity} ${item.unit} of ${item.name}`, actorId: auth.user.id, actorName: auth.user.name || auth.user.username, actorEmail: auth.user.email, targetId: data.id, targetName: item.name, metadata: { quantity, department: departmentName, status: data.status } });
    return NextResponse.json({ success: true, request: data }, { status: 201 });
  } catch (error) {
    console.error('Failed to save requisition:', error);
    return NextResponse.json({ error: 'Unable to save your request to Supabase.' }, { status: 500 });
  }
}
