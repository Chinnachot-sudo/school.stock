import { NextResponse } from 'next/server';
import { isServiceRoleConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { requireAnyPermission } from '@/lib/auth-server';
import { logAuditEvent } from '@/lib/audit';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAnyPermission(request, ['iam:settings:configure', 'inventory:item:create', 'inventory:item:delete']);
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const { id } = await params;
    const body = await request.json();
    const { name, icon, description } = body;

    // 1. Supabase Cloud DB
    if (isServiceRoleConfigured && supabase) {
      const updateData: any = {};
      if (name) updateData.name = name.trim();
      if (icon) updateData.icon = icon.trim();

      const { data, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await logAuditEvent({ category: 'INVENTORY', action: 'UPDATE_CATEGORY', details: `Updated category "${data.name}"`, actorId: authCheck.user.id, actorName: authCheck.user.name || authCheck.user.username, actorEmail: authCheck.user.email, targetId: id, targetName: data.name, after: data });
      return NextResponse.json({ success: true, category: data });
    }

    return NextResponse.json({ error: 'Supabase server access is not configured.' }, { status: 503 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAnyPermission(request, ['iam:settings:configure', 'inventory:item:create', 'inventory:item:delete']);
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const { id } = await params;
    if (!isServiceRoleConfigured || !supabase) return NextResponse.json({ error: 'Supabase server access is not configured.' }, { status: 503 });
    const { data: categoryBefore, error: categoryError } = await supabase.from('categories').select('id, name, icon').eq('id', id).maybeSingle();
    if (categoryError) throw categoryError;

    // 1. Supabase Cloud DB
    if (isServiceRoleConfigured && supabase) {
      const { data: deleted, error } = await supabase.from('categories').delete().eq('id', id).select('id').maybeSingle();
      if (error) {
        // If items are referencing this category
        if (error.message?.includes('violates foreign key')) {
          return NextResponse.json(
            { error: 'Cannot delete category: existing items are linked to this category. Please reassign items first.' },
            { status: 400 }
          );
        }
        throw error;
      }
      if (!deleted) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      await logAuditEvent({ category: 'INVENTORY', action: 'DELETE_CATEGORY', details: `Deleted category "${categoryBefore?.name || id}"`, actorId: authCheck.user.id, actorName: authCheck.user.name || authCheck.user.username, actorEmail: authCheck.user.email, targetId: id, targetName: categoryBefore?.name || id, before: categoryBefore || { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Supabase server access is not configured.' }, { status: 503 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 500 });
  }
}
