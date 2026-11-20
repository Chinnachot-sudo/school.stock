import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-server';
import { isServiceRoleConfigured, supabaseAdmin } from '@/lib/supabase';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

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
      itemCode: row.item_code || '',
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
    const assetId = typeof body.assetId === 'string' ? body.assetId.trim() : (typeof body.itemId === 'string' ? body.itemId.trim() : '');
    const quantity = Number(body.quantity) || 1;
    const departmentId = typeof body.departmentId === 'string' ? body.departmentId.trim() : '';
    const purpose = typeof body.purpose === 'string' ? body.purpose.trim().slice(0, 2000) : '';

    if (!assetId || !Number.isSafeInteger(quantity) || quantity < 1) {
      return NextResponse.json({ error: 'Please choose an asset/item and enter a quantity of at least 1.' }, { status: 400 });
    }

    // 1. Look up in Asset Management (assets table) first
    const { data: asset, error: assetError } = await supabaseAdmin
      .from('assets')
      .select('id, code, name, location, status, category')
      .eq('id', assetId)
      .maybeSingle();
    if (assetError) throw assetError;

    let targetId = '';
    let targetCode = '';
    let targetName = '';
    let targetUnit = 'Unit';
    let resolvedAssetId: string | null = null;

    if (asset) {
      targetId = asset.id;
      resolvedAssetId = asset.id;
      targetCode = asset.code;
      targetName = asset.name;
      targetUnit = 'Unit';
    } else {
      // Fallback: check items table if not found in assets
      const { data: item, error: itemError } = await supabaseAdmin
        .from('items')
        .select('id, code, name, unit')
        .eq('id', assetId)
        .maybeSingle();
      if (itemError) throw itemError;
      if (!item) {
        return NextResponse.json({ error: 'The selected asset could not be found in the system.' }, { status: 400 });
      }
      targetId = item.id;
      targetCode = item.code;
      targetName = item.name;
      targetUnit = item.unit || 'Unit';
    }

    let departmentName: string | null = null;
    if (departmentId) {
      const { data: department, error: departmentError } = await supabaseAdmin
        .from('departments')
        .select('id, name')
        .eq('id', departmentId)
        .maybeSingle();
      if (departmentError) throw departmentError;
      if (department) {
        departmentName = department.name;
      }
    }

    const row: Record<string, any> = {
      id: randomUUID(),
      item_id: targetId,
      asset_id: resolvedAssetId,
      item_code: targetCode,
      item_name: targetName,
      unit: targetUnit,
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

    await logAuditEvent({
      category: 'STOCK_OPERATION',
      action: 'CREATE_REQUISITION',
      details: `Requested borrow for asset "${targetName}" (${targetCode})`,
      actorId: auth.user.id,
      actorName: auth.user.name || auth.user.username,
      actorEmail: auth.user.email,
      targetId: data.id,
      targetName: targetName,
      metadata: { assetId: targetId, code: targetCode, quantity, department: departmentName, status: data.status }
    });

    return NextResponse.json({ success: true, request: data }, { status: 201 });
  } catch (error) {
    console.error('Failed to save requisition:', error);
    return NextResponse.json({ error: 'Unable to save your request to Supabase.' }, { status: 500 });
  }
}
