import { NextResponse } from 'next/server';
import { isServiceRoleConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { AuditLog } from '@/types/inventory';
import { requirePermission } from '@/lib/auth-server';

export async function GET(request: Request) {
  try {
    const authCheck = await requirePermission(request, 'audit:log:read');
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const category = searchParams.get('category');
    const q = searchParams.get('q')?.toLowerCase() || '';

    // 1. Try Supabase
    if (isServiceRoleConfigured && supabase) {
        let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
        if (category && category !== 'ALL') {
          query = query.eq('category', category);
        }
        const { data, error } = await query.limit(limit);
        if (!error && Array.isArray(data)) {
          let logs: AuditLog[] = data.map((row: any) => ({
            id: row.id,
            category: row.category,
            action: row.action,
            details: row.details,
            actorName: row.actor_name,
            actorEmail: undefined,
            targetId: row.target_id || undefined,
            targetName: row.target_name || undefined,
            metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
            before: row.before ? (typeof row.before === 'string' ? JSON.parse(row.before) : row.before) : undefined,
            after: row.after ? (typeof row.after === 'string' ? JSON.parse(row.after) : row.after) : undefined,
            createdAt: row.created_at
          }));

          if (q) {
            logs = logs.filter(
              l =>
                l.action.toLowerCase().includes(q) ||
                l.details.toLowerCase().includes(q) ||
                l.actorName.toLowerCase().includes(q) ||
                (l.targetName && l.targetName.toLowerCase().includes(q))
            );
          }

          return NextResponse.json({ logs, total: logs.length });
        }
        throw error || new Error('Invalid response from Supabase audit log query.');
    }

    return NextResponse.json({ error: 'Supabase audit log access is not configured.' }, { status: 503 });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  void request;
  return NextResponse.json(
    { error: 'Audit logs are append-only and may only be created by trusted server operations.' },
    { status: 405, headers: { Allow: 'GET' } }
  );
}
