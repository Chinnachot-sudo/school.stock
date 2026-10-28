import { NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/audit';
import { requirePermission } from '@/lib/auth-server';
import { isServiceRoleConfigured, supabaseAdmin } from '@/lib/supabase';

const ASSET_STATUSES = new Set(['IN_USE', 'ON_LOAN', 'MAINTENANCE', 'DISPOSED']);
const unavailable = () => NextResponse.json({ error: 'Asset database access is not configured on the server.' }, { status: 503 });

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(request, 'inventory:item:update');
  if (auth.errorResponse) return auth.errorResponse;
  if (!isServiceRoleConfigured || !supabaseAdmin) return unavailable();
  try {
    const { id } = await params;
    const body = await request.json();
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const status = typeof body.status === 'string' ? body.status : '';
    const cost = body.cost === '' || body.cost === null || body.cost === undefined ? null : Number(body.cost);
    const purchaseDate = typeof body.purchaseDate === 'string' && body.purchaseDate.trim() ? body.purchaseDate.trim() : null;
    if (!code || !name) return NextResponse.json({ error: 'Asset tag and name are required.' }, { status: 400 });
    if (!ASSET_STATUSES.has(status)) return NextResponse.json({ error: 'Choose a valid asset status.' }, { status: 400 });
    if (cost !== null && (!Number.isFinite(cost) || cost < 0)) return NextResponse.json({ error: 'Cost must be a non-negative number.' }, { status: 400 });
    if (purchaseDate && !/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) return NextResponse.json({ error: 'Purchase date must be a valid date.' }, { status: 400 });
    const { data: before, error: beforeError } = await supabaseAdmin.from('assets').select('*').eq('id', id).maybeSingle();
    if (beforeError) throw beforeError;
    if (!before) return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
    const { data, error } = await supabaseAdmin.from('assets').update({
      code, name,
      serial: typeof body.serial === 'string' ? body.serial.trim() || null : null,
      category: typeof body.category === 'string' ? body.category.trim() || null : null,
      location: typeof body.location === 'string' ? body.location.trim() || null : null,
      custodian: typeof body.custodian === 'string' ? body.custodian.trim() || null : null,
      purchase_date: purchaseDate, cost, status, updated_at: new Date().toISOString()
    }).eq('id', id).select('*').single();
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'That asset tag is already registered.' }, { status: 409 });
      throw error;
    }
    await logAuditEvent({ category: 'INVENTORY', action: 'UPDATE_ASSET', details: `Updated asset ${data.name} (${data.code})`, actorId: auth.user.id, actorName: auth.user.name || auth.user.username, actorEmail: auth.user.email, targetId: id, targetName: data.name, before, after: data });
    return NextResponse.json({ success: true, asset: { id: data.id, code: data.code, name: data.name, serial: data.serial || '', category: data.category || '', location: data.location || '', custodian: data.custodian || '', purchaseDate: data.purchase_date || '', cost: data.cost === null ? null : Number(data.cost), status: data.status } });
  } catch (error) {
    console.error('Failed to update asset:', error);
    return NextResponse.json({ error: 'Unable to update asset in Supabase.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(request, 'inventory:item:delete');
  if (auth.errorResponse) return auth.errorResponse;
  if (!isServiceRoleConfigured || !supabaseAdmin) return unavailable();
  try {
    const { id } = await params;
    const { data: before, error: beforeError } = await supabaseAdmin.from('assets').select('*').eq('id', id).maybeSingle();
    if (beforeError) throw beforeError;
    if (!before) return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
    const { error } = await supabaseAdmin.from('assets').delete().eq('id', id);
    if (error) throw error;
    await logAuditEvent({ category: 'INVENTORY', action: 'DELETE_ASSET', details: `Deleted asset ${before.name} (${before.code})`, actorId: auth.user.id, actorName: auth.user.name || auth.user.username, actorEmail: auth.user.email, targetId: id, targetName: before.name, before });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete asset:', error);
    return NextResponse.json({ error: 'Unable to delete asset from Supabase.' }, { status: 500 });
  }
}
