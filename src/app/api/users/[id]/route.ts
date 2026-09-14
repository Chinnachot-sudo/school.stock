import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth-server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, role, email, password } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (name) updates.name = String(name).trim();
    if (email) updates.email = String(email).trim();
    if (role && ['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(role)) {
      updates.role = role;
    }
    if (password && String(password).trim().length >= 4) {
      const { hash } = hashPassword(String(password).trim());
      updates.password_hash = hash;
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('app_users')
        .update(updates)
        .eq('id', id)
        .select('id, username, name, email, role, updated_at')
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, user: data });
    }

    return NextResponse.json({ success: true, user: { id, ...updates } });
  } catch (err: any) {
    console.error('PUT /api/users/[id] error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update user.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Protection: do not allow deleting default superadmin
    if (id === 'usr-superadmin' || id === 'superadmin') {
      return NextResponse.json(
        { error: 'Cannot delete the primary Super Administrator account.' },
        { status: 403 }
      );
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully.' });
  } catch (err: any) {
    console.error('DELETE /api/users/[id] error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete user.' },
      { status: 500 }
    );
  }
}
