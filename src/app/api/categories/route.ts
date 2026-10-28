import { NextResponse } from 'next/server';
import { isServiceRoleConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { requireAuth, requireAnyPermission } from '@/lib/auth-server';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const authCheck = await requireAuth(request);
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }
    if (!isServiceRoleConfigured || !supabase) return NextResponse.json({ error: 'Supabase server access is not configured.' }, { status: 503 });
    const [catRes, deptRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('departments').select('*').order('name')
    ]);
    if (catRes.error || deptRes.error) throw new Error(catRes.error?.message || deptRes.error?.message || 'Failed to load categories');
    return NextResponse.json({ categories: catRes.data || [], departments: deptRes.data || [] });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authCheck = await requireAnyPermission(request, ['iam:settings:configure', 'inventory:item:create']);
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const body = await request.json();
    const { name, icon = '🏷️' } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanIcon = icon.trim() || '🏷️';
    const requestedCode = typeof body.code === 'string' ? body.code.trim().toLowerCase() : '';
    const categoryId = requestedCode ? (requestedCode.startsWith('cat-') ? requestedCode : `cat-${requestedCode}`) : `cat-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    // 1. Supabase Cloud DB
    if (isServiceRoleConfigured && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          id: categoryId,
          name: cleanName,
          icon: cleanIcon
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase category insert error:', error);
        throw new Error(error.message || 'Failed to insert category in Supabase');
      }

      await logAuditEvent({ category: 'INVENTORY', action: 'CREATE_CATEGORY', details: `Created category "${cleanName}"`, actorId: authCheck.user.id, actorName: authCheck.user.name || authCheck.user.username, actorEmail: authCheck.user.email, targetId: categoryId, targetName: cleanName, after: { id: categoryId, name: cleanName, icon: cleanIcon } });

      return NextResponse.json({
        success: true,
        category: data
      });
    }

    return NextResponse.json({ error: 'Supabase server access is not configured.' }, { status: 503 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: error.message || 'Internal error creating category' }, { status: 500 });
  }
}
