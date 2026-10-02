import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { AuditLog } from '@/types/inventory';
import { logAuditEvent } from '@/lib/audit';
import { requireAuth, requirePermission } from '@/lib/auth-server';

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
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
        if (category && category !== 'ALL') {
          query = query.eq('category', category);
        }
        const { data, error } = await query.limit(limit);
        if (!error && Array.isArray(data) && data.length > 0) {
          let logs: AuditLog[] = data.map((row: any) => ({
            id: row.id,
            category: row.category,
            action: row.action,
            details: row.details,
            actorName: row.actor_name,
            actorEmail: row.actor_email || undefined,
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
      } catch (err) {
        console.warn('Supabase audit_logs read failed, falling back to local DB:', err);
      }
    }

    // 2. Local DB
    const db = readDb();
    let logs = (db.auditLogs || []).slice();

    if (category && category !== 'ALL') {
      logs = logs.filter(l => l.category === category);
    }

    if (q) {
      logs = logs.filter(
        l =>
          l.action.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.actorName.toLowerCase().includes(q) ||
          (l.targetName && l.targetName.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({
      logs: logs.slice(0, limit),
      total: logs.length
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authCheck = await requireAuth(request);
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const body = await request.json();
    const { category, action, details, actorName, actorEmail, targetId, targetName, metadata, before, after } = body;

    if (!category || !action || !details) {
      return NextResponse.json({ error: 'category, action, and details are required' }, { status: 400 });
    }

    const newLog = await logAuditEvent({
      category,
      action,
      details,
      actorName: actorName || authCheck.user.username || authCheck.user.name,
      actorEmail: actorEmail || authCheck.user.email,
      targetId,
      targetName,
      metadata,
      before,
      after
    });

    return NextResponse.json({ success: true, log: newLog });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create audit log' }, { status: 500 });
  }
}
