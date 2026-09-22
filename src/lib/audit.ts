import { readDb, writeDb } from '@/lib/db';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { AuditLog, AuditActionCategory } from '@/types/inventory';

export interface LogAuditParams {
  category: AuditActionCategory;
  action: string;
  details: string;
  actorName?: string;
  actorEmail?: string;
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, any>;
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
    createdAt: new Date().toISOString()
  };

  // 1. Try persisting to Supabase Cloud DB if available
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('audit_logs').insert({
        id: newLog.id,
        category: newLog.category,
        action: newLog.action,
        details: newLog.details,
        actor_name: newLog.actorName,
        actor_email: newLog.actorEmail || null,
        target_id: newLog.targetId || null,
        target_name: newLog.targetName || null,
        metadata: newLog.metadata ? JSON.stringify(newLog.metadata) : null,
        created_at: newLog.createdAt
      });
    } catch (sbErr) {
      // Table might not exist yet in Supabase, silently fallback to local DB
      console.warn('Supabase audit_logs insert skipped:', sbErr);
    }
  }

  // 2. Always persist to Local JSON DB as reliable cache
  try {
    const db = readDb();
    if (!Array.isArray(db.auditLogs)) {
      db.auditLogs = [];
    }
    // Keep most recent 1,000 logs in local cache
    db.auditLogs.unshift(newLog);
    if (db.auditLogs.length > 1000) {
      db.auditLogs = db.auditLogs.slice(0, 1000);
    }
    writeDb(db);
  } catch (dbErr) {
    console.warn('Local db auditLogs write error:', dbErr);
  }

  return newLog;
}
