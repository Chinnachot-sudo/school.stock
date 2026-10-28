import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { isServiceRoleConfigured, supabaseAdmin } from '@/lib/supabase';
import { requireAuth, requirePermission } from '@/lib/auth-server';
import { logAuditEvent } from '@/lib/audit';

const unavailable = () => NextResponse.json({ error: 'Supabase server access is not configured.' }, { status: 503 });

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth.errorResponse) return auth.errorResponse;
  if (!isServiceRoleConfigured || !supabaseAdmin) return unavailable();
  try {
    const { data, error } = await supabaseAdmin.from('units_of_measure').select('*').order('name');
    if (error) throw error;
    return NextResponse.json({ units: (data || []).map((row: any) => ({ ...row, type: row.measurement_type })) });
  } catch (error) {
    console.error('Error loading units of measure:', error);
    return NextResponse.json({ error: 'Failed to load units of measure from Supabase.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requirePermission(request, 'iam:settings:configure');
  if (auth.errorResponse) return auth.errorResponse;
  if (!isServiceRoleConfigured || !supabaseAdmin) return unavailable();
  try {
    const body = await request.json();
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const type = typeof body.type === 'string' ? body.type.trim() : '';
    if (!code || !name || !type) return NextResponse.json({ error: 'Code, unit name, and measurement type are required.' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('units_of_measure').insert({ id: randomUUID(), code, name, measurement_type: type, status: body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' }).select('*').single();
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'A unit with this code already exists.' }, { status: 409 });
      throw error;
    }
    await logAuditEvent({ category: 'SYSTEM', action: 'CREATE_UNIT_OF_MEASURE', details: `Created unit "${name}" (${code})`, actorId: auth.user.id, actorName: auth.user.name || auth.user.username, actorEmail: auth.user.email, targetId: data.id, targetName: data.name, after: data });
    return NextResponse.json({ success: true, unit: { ...data, type: data.measurement_type } }, { status: 201 });
  } catch (error) {
    console.error('Error creating unit of measure:', error);
    return NextResponse.json({ error: 'Failed to save unit to Supabase.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requirePermission(request, 'iam:settings:configure');
  if (auth.errorResponse) return auth.errorResponse;
  if (!isServiceRoleConfigured || !supabaseAdmin) return unavailable();
  try {
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const type = typeof body.type === 'string' ? body.type.trim() : '';
    if (!id || !code || !name || !type) return NextResponse.json({ error: 'ID, code, unit name, and measurement type are required.' }, { status: 400 });
    const { data: before, error: beforeError } = await supabaseAdmin.from('units_of_measure').select('*').eq('id', id).maybeSingle();
    if (beforeError) throw beforeError;
    if (!before) return NextResponse.json({ error: 'Unit of measure not found.' }, { status: 404 });
    const { data, error } = await supabaseAdmin.from('units_of_measure').update({ code, name, measurement_type: type, status: body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE', updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'A unit with this code already exists.' }, { status: 409 });
      throw error;
    }
    await logAuditEvent({ category: 'SYSTEM', action: 'UPDATE_UNIT_OF_MEASURE', details: `Updated unit "${name}" (${code})`, actorId: auth.user.id, actorName: auth.user.name || auth.user.username, actorEmail: auth.user.email, targetId: id, targetName: name, before, after: data });
    return NextResponse.json({ success: true, unit: { ...data, type: data.measurement_type } });
  } catch (error) {
    console.error('Error updating unit of measure:', error);
    return NextResponse.json({ error: 'Failed to update unit in Supabase.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requirePermission(request, 'iam:settings:configure');
  if (auth.errorResponse) return auth.errorResponse;
  if (!isServiceRoleConfigured || !supabaseAdmin) return unavailable();
  try {
    const id = new URL(request.url).searchParams.get('id')?.trim() || '';
    if (!id) return NextResponse.json({ error: 'Unit ID is required.' }, { status: 400 });
    const { data: before, error: beforeError } = await supabaseAdmin.from('units_of_measure').select('*').eq('id', id).maybeSingle();
    if (beforeError) throw beforeError;
    if (!before) return NextResponse.json({ error: 'Unit of measure not found.' }, { status: 404 });
    const { data: linkedItems, error: linkedError } = await supabaseAdmin.from('items').select('id').ilike('unit', before.code).limit(1);
    if (linkedError) throw linkedError;
    if (linkedItems?.length) return NextResponse.json({ error: 'This unit is used by inventory items. Set it to Inactive to preserve those records.' }, { status: 409 });
    const { error } = await supabaseAdmin.from('units_of_measure').delete().eq('id', id);
    if (error) throw error;
    await logAuditEvent({ category: 'SYSTEM', action: 'DELETE_UNIT_OF_MEASURE', details: `Deleted unit "${before.name}" (${before.code})`, actorId: auth.user.id, actorName: auth.user.name || auth.user.username, actorEmail: auth.user.email, targetId: id, targetName: before.name, before });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting unit of measure:', error);
    return NextResponse.json({ error: 'Failed to delete unit from Supabase.' }, { status: 500 });
  }
}
