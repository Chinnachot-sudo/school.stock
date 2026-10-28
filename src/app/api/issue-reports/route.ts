import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { isServiceRoleConfigured, supabaseAdmin } from '@/lib/supabase';
import { logAuditEvent } from '@/lib/audit';

const ISSUE_TYPES = new Set(['DAMAGED', 'DEFECTIVE', 'MISSING', 'OUT_OF_STOCK', 'OTHER']);

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth.errorResponse) return auth.errorResponse;
  if (!isServiceRoleConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase server access is not configured.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const itemName = typeof body.itemName === 'string' ? body.itemName.trim().slice(0, 200) : '';
    const issueType = typeof body.issueType === 'string' ? body.issueType : '';
    const details = typeof body.details === 'string' ? body.details.trim().slice(0, 4000) : '';

    if (!itemName || !ISSUE_TYPES.has(issueType)) {
      return NextResponse.json({ error: 'Enter the item name and choose a valid issue type.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from('issue_reports').insert({
      id: randomUUID(),
      item_name: itemName,
      issue_type: issueType,
      details: details || null,
      reporter_id: auth.user.id,
      reporter_name: auth.user.name || auth.user.username,
      status: 'OPEN'
    }).select('id, item_name, issue_type, status, created_at').single();
    if (error) throw error;
    await logAuditEvent({ category: 'INVENTORY', action: 'CREATE_ISSUE_REPORT', details: `Reported ${issueType.toLowerCase()} issue for ${itemName}`, actorId: auth.user.id, actorName: auth.user.name || auth.user.username, actorEmail: auth.user.email, targetId: data.id, targetName: itemName, metadata: { issueType, status: data.status } });

    return NextResponse.json({ success: true, report: data }, { status: 201 });
  } catch (error) {
    console.error('Failed to save issue report:', error);
    return NextResponse.json({ error: 'Unable to save the issue report to Supabase.' }, { status: 500 });
  }
}
