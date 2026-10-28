import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { Department } from '@/types/inventory';
import { isServiceRoleConfigured, supabaseAdmin } from '@/lib/supabase';
import { requireAuth, requirePermission } from '@/lib/auth-server';
import { logAuditEvent } from '@/lib/audit';

function unavailable() {
  return NextResponse.json({ error: 'Supabase server access is not configured.' }, { status: 503 });
}

function toDepartment(row: { id: string; name: string }): Department {
  return { id: row.id, name: row.name };
}

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth.errorResponse) return auth.errorResponse;
  if (!isServiceRoleConfigured || !supabaseAdmin) return unavailable();

  try {
    const { data, error } = await supabaseAdmin.from('departments').select('id, name').order('name');
    if (error) throw error;
    return NextResponse.json({ departments: (data || []).map(toDepartment) });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Failed to fetch departments from Supabase.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requirePermission(request, 'iam:settings:configure');
  if (auth.errorResponse) return auth.errorResponse;
  if (!isServiceRoleConfigured || !supabaseAdmin) return unavailable();

  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 120) {
      return NextResponse.json({ error: 'Department name is required (maximum 120 characters).' }, { status: 400 });
    }

    const { data: existing, error: lookupError } = await supabaseAdmin
      .from('departments')
      .select('id')
      .ilike('name', name)
      .limit(1);
    if (lookupError) throw lookupError;
    if (existing?.length) return NextResponse.json({ error: 'A department with that name already exists.' }, { status: 409 });

    const { data, error } = await supabaseAdmin
      .from('departments')
      .insert({ id: randomUUID(), name })
      .select('id, name')
      .single();
    if (error) throw error;
    await logAuditEvent({ category: 'SYSTEM', action: 'CREATE_DEPARTMENT', details: `Created department "${data.name}"`, actorId: auth.user.id, actorName: auth.user.name || auth.user.username, actorEmail: auth.user.email, targetId: data.id, targetName: data.name, after: data });
    return NextResponse.json({ success: true, department: toDepartment(data) }, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({ error: 'Failed to save department to Supabase.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requirePermission(request, 'iam:settings:configure');
  if (auth.errorResponse) return auth.errorResponse;
  if (!isServiceRoleConfigured || !supabaseAdmin) return unavailable();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id')?.trim() || '';
    if (!id) return NextResponse.json({ error: 'Department ID is required.' }, { status: 400 });

    const { data: department, error: departmentError } = await supabaseAdmin
      .from('departments')
      .select('id, name')
      .eq('id', id)
      .maybeSingle();
    if (departmentError) throw departmentError;
    if (!department) return NextResponse.json({ error: 'Department not found.' }, { status: 404 });

    const { data: linkedRequests, error: linkedError } = await supabaseAdmin
      .from('requisitions')
      .select('id')
      .eq('department_id', id)
      .limit(1);
    if (linkedError) throw linkedError;
    if (linkedRequests?.length) {
      return NextResponse.json({ error: 'This department is used by requisition records and cannot be deleted. Rename it instead to preserve history.' }, { status: 409 });
    }

    const { data: deleted, error } = await supabaseAdmin
      .from('departments')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) {
      if (error.code === '23503') {
        return NextResponse.json({ error: 'This department is linked to existing records and cannot be deleted. Rename it instead.' }, { status: 409 });
      }
      throw error;
    }
    if (!deleted) return NextResponse.json({ error: 'Department not found.' }, { status: 404 });

    await logAuditEvent({
      category: 'SYSTEM',
      action: 'DELETE_DEPARTMENT',
      details: `Deleted department "${department.name}"`,
      actorId: auth.user.id,
      actorName: auth.user.name || auth.user.username,
      actorEmail: auth.user.email,
      targetId: department.id,
      targetName: department.name,
      before: department
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json({ error: 'Failed to delete department from Supabase.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requirePermission(request, 'iam:settings:configure');
  if (auth.errorResponse) return auth.errorResponse;
  if (!isServiceRoleConfigured || !supabaseAdmin) return unavailable();

  try {
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!id || !name || name.length > 120) {
      return NextResponse.json({ error: 'Department ID and a valid name are required.' }, { status: 400 });
    }
    if ('allocatedBudget' in body || 'spentBudget' in body || 'fiscalYear' in body) {
      return NextResponse.json({ error: 'Budget and fiscal-year fields are not present in the connected departments table.' }, { status: 400 });
    }

    const { data: duplicate, error: duplicateError } = await supabaseAdmin
      .from('departments')
      .select('id')
      .ilike('name', name)
      .neq('id', id)
      .limit(1);
    if (duplicateError) throw duplicateError;
    if (duplicate?.length) return NextResponse.json({ error: 'Another department already uses that name.' }, { status: 409 });

    const { data: previous, error: previousError } = await supabaseAdmin
      .from('departments')
      .select('id, name')
      .eq('id', id)
      .maybeSingle();
    if (previousError) throw previousError;
    if (!previous) return NextResponse.json({ error: 'Department not found.' }, { status: 404 });

    const { data, error } = await supabaseAdmin
      .from('departments')
      .update({ name })
      .eq('id', id)
      .select('id, name')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Department not found.' }, { status: 404 });
    await logAuditEvent({ category: 'SYSTEM', action: 'UPDATE_DEPARTMENT', details: `Renamed department "${previous.name}" to "${data.name}"`, actorId: auth.user.id, actorName: auth.user.name || auth.user.username, actorEmail: auth.user.email, targetId: data.id, targetName: data.name, before: previous, after: data });
    return NextResponse.json({ success: true, department: toDepartment(data) });
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json({ error: 'Failed to update department in Supabase.' }, { status: 500 });
  }
}
