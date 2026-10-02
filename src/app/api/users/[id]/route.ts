import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { hashPassword, requirePermission } from '@/lib/auth-server';
import { can } from '@/lib/auth/permissions';
import { toDbRole, toUiRole } from '@/lib/auth/roles';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requirePermission(request, 'iam:user:update');
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const { id } = await params;
    const body: unknown = await request.json();
    const dataObj = (body && typeof body === 'object') ? (body as Record<string, unknown>) : {};
    const { name, role, email, password } = dataObj;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updates.name = String(name).trim();
    if (email !== undefined) updates.email = String(email).trim();

    if (role !== undefined) {
      const dbRole = toDbRole(String(role));
      if (!dbRole) {
        return NextResponse.json(
          { error: `Invalid role "${String(role)}". Allowed roles: SUPER_ADMIN, ADMIN, WAREHOUSE, CASHIER, ACCOUNTANT, TEACHER.` },
          { status: 400 }
        );
      }
      if (dbRole === 'super_admin' && !can(authCheck.user, 'iam:role:assign')) {
        return NextResponse.json(
          { error: 'Forbidden: Assigning the SUPER_ADMIN role requires permission "iam:role:assign".' },
          { status: 403 }
        );
      }
      updates.role = dbRole;
    }

    if (password !== undefined && password !== '') {
      const pwd = String(password).trim();
      if (pwd.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters long.' },
          { status: 400 }
        );
      }
      const { hash } = hashPassword(pwd);
      updates.password_hash = hash;
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('app_users')
        .update(updates)
        .eq('id', id)
        .select('id, username, name, email, role, updated_at')
        .single();

      if (error) {
        console.error(`Failed to update app_user ${id}:`, error);
        return NextResponse.json(
          { error: 'An unexpected database error occurred while updating the user.' },
          { status: 500 }
        );
      }

      // Update role in user_roles if changed
      if (updates.role) {
        const { error: delErr } = await supabase.from('user_roles').delete().eq('user_id', id);
        if (delErr) {
          console.error(`Failed to delete previous roles for user ${id}:`, delErr);
        }
        const { error: insErr } = await supabase.from('user_roles').insert({
          user_id: id,
          role_id: updates.role
        });
        if (insErr) {
          console.error(`Failed to sync role into user_roles for user ${id}:`, insErr);
        }
      }

      return NextResponse.json({
        success: true,
        user: {
          ...data,
          role: toUiRole(data.role)
        }
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id,
        ...updates,
        role: updates.role ? toUiRole(String(updates.role)) : undefined
      }
    });
  } catch (err: unknown) {
    console.error('PUT /api/users/[id] error:', err);
    return NextResponse.json(
      { error: 'An unexpected internal error occurred while updating the user.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requirePermission(request, 'iam:user:disable');
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const { id } = await params;

    // Protection: do not allow deleting default superadmin
    if (id === 'usr-superadmin' || id === 'superadmin') {
      return NextResponse.json(
        { error: 'Cannot delete the primary Super Administrator account.' },
        { status: 403 }
      );
    }

    if (isSupabaseConfigured && supabase) {
      // Clean up user_roles first
      const { error: delRolesErr } = await supabase.from('user_roles').delete().eq('user_id', id);
      if (delRolesErr) {
        console.warn(`Warning: failed to clear user_roles for user ${id}:`, delRolesErr);
      }

      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Failed to delete user ${id} from app_users:`, error);
        return NextResponse.json(
          { error: 'An unexpected database error occurred while deleting the user.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully.' });
  } catch (err: unknown) {
    console.error('DELETE /api/users/[id] error:', err);
    return NextResponse.json(
      { error: 'An unexpected internal error occurred while deleting the user.' },
      { status: 500 }
    );
  }
}
