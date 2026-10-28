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
    const { data, error } = await supabaseAdmin.from('storage_locations').select('*').order('name');
    if (error) throw error;
    return NextResponse.json({ locations: data || [] });
  } catch (error) {
    console.error('Error loading storage locations:', error);
    return NextResponse.json({ error: 'Failed to load storage locations from Supabase.' }, { status: 500 });
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
    if (!code || !name) return NextResponse.json({ error: 'Location code and name are required.' }, { status: 400 });
    const row = { id: randomUUID(), code, name, building_room: String(body.building_room || '').trim() || null, description: String(body.description || '').trim() || null, capacity: String(body.capacity || '').trim() || null, status: body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' };
    const { data, error } = await supabaseAdmin.from('storage_locations').insert(row).select('*').single();
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'A location with this code already exists.' }, { status: 409 });
      throw error;
    }
    await logAuditEvent({ category: 'SYSTEM', action: 'CREATE_STORAGE_LOCATION', details: `Created storage location "${name}"`, actorId: auth.user.id, actorName: auth.user.name || auth.user.username, actorEmail: auth.user.email, targetId: data.id, targetName: data.name, after: data });
    return NextResponse.json({ success: true, location: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating storage location:', error);
    return NextResponse.json({ error: 'Failed to save storage location to Supabase.' }, { status: 500 });
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
    if (!id || !code || !name) return NextResponse.json({ error: 'Location ID, code, and name are required.' }, { status: 400 });
    const { data: before, error: beforeError } = await supabaseAdmin.from('storage_locations').select('*').eq('id', id).maybeSingle();
    if (beforeError) throw beforeError;
    if (!before) return NextResponse.json({ error: 'Storage location not found.' }, { status: 404 });
    const update = { code, name, building_room: String(body.building_room || '').trim() || null, description: String(body.description || '').trim() || null, capacity: String(body.capacity || '').trim() || null, status: body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE', updated_at: new Date().toISOString() };
    const { data, error } = await supabaseAdmin.from('storage_locations').update(update).eq('id', id).select('*').single();
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'A location with this code already exists.' }, { status: 409 });
      throw error;
    }
    await logAuditEvent({ category: 'SYSTEM', action: 'UPDATE_STORAGE_LOCATION', details: `Updated storage location "${name}"`, actorId: auth.user.id, actorName: auth.user.name || auth.user.username, actorEmail: auth.user.email, targetId: id, targetName: name, before, after: data });
    return NextResponse.json({ success: true, location: data }, { status: 200 });
  } catch (error) {
    console.error('Error updating storage location:', error);
    return NextResponse.json({ error: 'Failed to update storage location in Supabase.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requirePermission(request, 'iam:settings:configure');
  if (auth.errorResponse) return auth.errorResponse;
  if (!isServiceRoleConfigured || !supabaseAdmin) return unavailable();
  try {
    const id = new URL(request.url).searchParams.get('id')?.trim() || '';
    if (!id) return NextResponse.json({ error: 'Location ID is required.' }, { status: 400 });
    const { data: before, error: beforeError } = await supabaseAdmin.from('storage_locations').select('*').eq('id', id).maybeSingle();
    if (beforeError) throw beforeError;
    if (!before) return NextResponse.json({ error: 'Storage location not found.' }, { status: 404 });
    const { data: linkedItems, error: linkedError } = await supabaseAdmin.from('items').select('id').in('location', [before.name, before.code].filter(Boolean)).limit(1);
    if (linkedError) throw linkedError;
    if (linkedItems?.length) return NextResponse.json({ error: 'This location is used by inventory items. Set it to Inactive to preserve those records.' }, { status: 409 });
    const { error } = await supabaseAdmin.from('storage_locations').delete().eq('id', id);
    if (error) throw error;
    await logAuditEvent({ category: 'SYSTEM', action: 'DELETE_STORAGE_LOCATION', details: `Deleted storage location "${before.name}"`, actorId: auth.user.id, actorName: auth.user.name || auth.user.username, actorEmail: auth.user.email, targetId: id, targetName: before.name, before });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting storage location:', error);
    return NextResponse.json({ error: 'Failed to delete storage location from Supabase.' }, { status: 500 });
  }
}
