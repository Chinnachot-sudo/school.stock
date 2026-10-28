import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { isServiceRoleConfigured, supabaseAdmin } from '@/lib/supabase';
import { requireAuth, requirePermission } from '@/lib/auth-server';
import { logAuditEvent } from '@/lib/audit';

const unavailable = () => NextResponse.json({ error: 'Supabase server access is not configured.' }, { status: 503 });
const customerTypes = new Set(['STUDENT', 'PARENT', 'TEACHER', 'GENERAL']);

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth.errorResponse) return auth.errorResponse;
  if (!isServiceRoleConfigured || !supabaseAdmin) return unavailable();
  try {
    const { data, error } = await supabaseAdmin.from('customer_tier_pricing').select('*').order('customer_type');
    if (error) throw error;
    return NextResponse.json({ tiers: data || [] });
  } catch (error) {
    console.error('Error loading customer tier pricing:', error);
    return NextResponse.json({ error: 'Failed to load customer pricing from Supabase.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requirePermission(request, 'iam:settings:configure');
  if (auth.errorResponse) return auth.errorResponse;
  if (!isServiceRoleConfigured || !supabaseAdmin) return unavailable();
  try {
    const body = await request.json();
    const customerType = typeof body.customer_type === 'string' ? body.customer_type.toUpperCase() : '';
    const label = typeof body.label === 'string' ? body.label.trim() : '';
    const discount = Number(body.discount_percent);
    if (!customerTypes.has(customerType) || !label || !Number.isFinite(discount) || discount < 0 || discount > 100) return NextResponse.json({ error: 'Select a valid customer type, enter a label, and set a discount from 0 to 100%.' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('customer_tier_pricing').insert({ id: randomUUID(), customer_type: customerType, label, discount_percent: discount, status: body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' }).select('*').single();
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'A pricing rule already exists for this customer type. Edit that rule instead.' }, { status: 409 });
      throw error;
    }
    await logAuditEvent({ category: 'SYSTEM', action: 'CREATE_CUSTOMER_TIER_PRICING', details: `Created ${label} pricing rule (${discount}% discount)`, actorId: auth.user.id, actorName: auth.user.name || auth.user.username, actorEmail: auth.user.email, targetId: data.id, targetName: data.label, after: data });
    return NextResponse.json({ success: true, tier: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer tier pricing:', error);
    return NextResponse.json({ error: 'Failed to save customer pricing to Supabase.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requirePermission(request, 'iam:settings:configure');
  if (auth.errorResponse) return auth.errorResponse;
  if (!isServiceRoleConfigured || !supabaseAdmin) return unavailable();
  try {
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const customerType = typeof body.customer_type === 'string' ? body.customer_type.toUpperCase() : '';
    const label = typeof body.label === 'string' ? body.label.trim() : '';
    const discount = Number(body.discount_percent);
    if (!id || !customerTypes.has(customerType) || !label || !Number.isFinite(discount) || discount < 0 || discount > 100) return NextResponse.json({ error: 'ID, valid customer type, label, and a discount from 0 to 100% are required.' }, { status: 400 });
    const { data: before, error: beforeError } = await supabaseAdmin.from('customer_tier_pricing').select('*').eq('id', id).maybeSingle();
    if (beforeError) throw beforeError;
    if (!before) return NextResponse.json({ error: 'Customer pricing rule not found.' }, { status: 404 });
    const { data, error } = await supabaseAdmin.from('customer_tier_pricing').update({ customer_type: customerType, label, discount_percent: discount, status: body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE', updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'A pricing rule already exists for this customer type.' }, { status: 409 });
      throw error;
    }
    await logAuditEvent({ category: 'SYSTEM', action: 'UPDATE_CUSTOMER_TIER_PRICING', details: `Updated ${label} pricing rule (${discount}% discount)`, actorId: auth.user.id, actorName: auth.user.name || auth.user.username, actorEmail: auth.user.email, targetId: id, targetName: data.label, before, after: data });
    return NextResponse.json({ success: true, tier: data });
  } catch (error) {
    console.error('Error updating customer tier pricing:', error);
    return NextResponse.json({ error: 'Failed to update customer pricing in Supabase.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requirePermission(request, 'iam:settings:configure');
  if (auth.errorResponse) return auth.errorResponse;
  if (!isServiceRoleConfigured || !supabaseAdmin) return unavailable();
  try {
    const id = new URL(request.url).searchParams.get('id')?.trim() || '';
    if (!id) return NextResponse.json({ error: 'Pricing rule ID is required.' }, { status: 400 });
    const { data: before, error: beforeError } = await supabaseAdmin.from('customer_tier_pricing').select('*').eq('id', id).maybeSingle();
    if (beforeError) throw beforeError;
    if (!before) return NextResponse.json({ error: 'Customer pricing rule not found.' }, { status: 404 });
    const { error } = await supabaseAdmin.from('customer_tier_pricing').delete().eq('id', id);
    if (error) throw error;
    await logAuditEvent({ category: 'SYSTEM', action: 'DELETE_CUSTOMER_TIER_PRICING', details: `Deleted ${before.label} pricing rule`, actorId: auth.user.id, actorName: auth.user.name || auth.user.username, actorEmail: auth.user.email, targetId: id, targetName: before.label, before });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer tier pricing:', error);
    return NextResponse.json({ error: 'Failed to delete customer pricing from Supabase.' }, { status: 500 });
  }
}
