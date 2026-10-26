import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/audit';
import { requirePermission } from '@/lib/auth-server';
import { isServiceRoleConfigured, supabaseAdmin } from '@/lib/supabase';

const ALLOWED_STATUSES = new Set(['IN_USE', 'ON_LOAN', 'MAINTENANCE', 'DISPOSED']);

function toAsset(row: any) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    serial: row.serial || '',
    category: row.category || '',
    location: row.location || '',
    custodian: row.custodian || '',
    purchaseDate: row.purchase_date || '',
    cost: row.cost === null ? null : Number(row.cost),
    status: row.status,
    createdAt: row.created_at
  };
}

export async function GET(request: Request) {
  const auth = await requirePermission(request, 'inventory:item:read');
  if (auth.errorResponse) return auth.errorResponse;
  if (!isServiceRoleConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Asset database access is not configured on the server.' }, { status: 503 });
  }

  try {
    const { data, error } = await supabaseAdmin.from('assets').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ assets: (data || []).map(toAsset) });
  } catch (error) {
    console.error('Failed to load asset register:', error);
    return NextResponse.json({ error: 'Unable to load asset records from Supabase.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requirePermission(request, 'inventory:item:create');
  if (auth.errorResponse) return auth.errorResponse;
  if (!isServiceRoleConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Asset database access is not configured on the server.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const status = typeof body.status === 'string' ? body.status : '';
    const costText = body.cost === '' || body.cost === null || body.cost === undefined ? null : String(body.cost);
    const cost = costText === null ? null : Number(costText);
    const purchaseDate = typeof body.purchaseDate === 'string' && body.purchaseDate.trim() ? body.purchaseDate.trim() : null;

    if (!code || !name) {
      return NextResponse.json({ error: 'Asset tag and asset name are required.' }, { status: 400 });
    }
    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Choose a valid asset status.' }, { status: 400 });
    }
    if (cost !== null && (!Number.isFinite(cost) || cost < 0)) {
      return NextResponse.json({ error: 'Cost must be a non-negative number.' }, { status: 400 });
    }
    if (purchaseDate && !/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) {
      return NextResponse.json({ error: 'Purchase date must be a valid date.' }, { status: 400 });
    }

    const row = {
      id: randomUUID(),
      code,
      name,
      serial: typeof body.serial === 'string' ? body.serial.trim() || null : null,
      category: typeof body.category === 'string' ? body.category.trim() || null : null,
      location: typeof body.location === 'string' ? body.location.trim() || null : null,
      custodian: typeof body.custodian === 'string' ? body.custodian.trim() || null : null,
      purchase_date: purchaseDate,
      cost,
      status,
      created_by: auth.user.id,
      created_by_name: auth.user.name || auth.user.username,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin.from('assets').insert(row).select('*').single();
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'That asset tag is already registered.' }, { status: 409 });
      }
      throw error;
    }

    try {
      await logAuditEvent({
        category: 'INVENTORY',
        action: 'CREATE_ASSET',
        details: `Registered asset ${name} (${code})`,
        actorName: row.created_by_name,
        actorEmail: auth.user.email,
        targetId: row.id,
        targetName: name,
        metadata: { code, status }
      });
    } catch (auditError) {
      // The asset row is already safely persisted; an audit-schema mismatch
      // must not turn a successful create into a failed response/retry.
      console.error('Asset saved but audit event could not be recorded:', auditError);
    }

    return NextResponse.json({ success: true, asset: toAsset(data) }, { status: 201 });
  } catch (error) {
    console.error('Failed to create asset:', error);
    return NextResponse.json({ error: 'Unable to save asset to Supabase.' }, { status: 500 });
  }
}
