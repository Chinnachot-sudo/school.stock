import { isServiceRoleConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { AuditLog, AuditActionCategory } from '@/types/inventory';

export interface LogAuditParams {
  category: AuditActionCategory;
  action: string;
  details: string;
  actorName?: string;
  actorEmail?: string;
  actorId?: string;
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, any>;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
}

export async function logAuditEvent(params: LogAuditParams): Promise<AuditLog> {
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    category: params.category,
    action: params.action,
    details: params.details,
    actorName: (params.actorName || 'System User').trim(),
    actorEmail: params.actorEmail?.trim() || undefined,
    targetId: params.targetId,
    targetName: params.targetName,
    metadata: params.metadata,
    before: params.before || undefined,
    after: params.after || undefined,
    createdAt: new Date().toISOString()
  };

  if (!isServiceRoleConfigured || !supabase) {
    throw new Error('Audit logging requires server-side Supabase credentials.');
  }

  const row = {
    id: newLog.id,
    category: newLog.category,
    action: newLog.action,
    details: newLog.details,
    actor_id: params.actorId || null,
    actor_name: newLog.actorName,
    target_id: newLog.targetId || null,
    target_name: newLog.targetName || null,
    metadata: newLog.metadata || null,
    before: newLog.before || null,
    after: newLog.after || null,
    created_at: newLog.createdAt
  };

  const { error } = await supabase.from('audit_logs').insert(row);
  if (error) throw new Error(`Failed to persist audit log: ${error.message}`);

  return newLog;
}
