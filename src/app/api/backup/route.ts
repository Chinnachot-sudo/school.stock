import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { requirePermission } from '@/lib/auth-server';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const authCheck = await requirePermission(request, 'iam:settings:configure');
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const exportedAt = new Date().toISOString();
    let backupPayload: Record<string, unknown> = {};

    if (isSupabaseConfigured && supabase) {
      const [
        itemsRes,
        categoriesRes,
        departmentsRes,
        customersRes,
        invoicesRes,
        receiptsRes,
        transactionsRes,
        auditLogsRes,
        usersRes
      ] = await Promise.all([
        supabase.from('items').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('departments').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('receipts').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('audit_logs').select('*'),
        supabase.from('app_users').select('id, username, email, full_name, role, status, created_at, updated_at')
      ]);

      const items = itemsRes.data || [];
      const categories = categoriesRes.data || [];
      const departments = departmentsRes.data || [];
      const customers = customersRes.data || [];
      const invoices = invoicesRes.data || [];
      const receipts = receiptsRes.data || [];
      const transactions = transactionsRes.data || [];
      const auditLogs = auditLogsRes.data || [];
      const users = usersRes.data || [];

      backupPayload = {
        metadata: {
          system: 'Roong Aroon International School - Stock Management System',
          exportedAt,
          version: '1.0.0',
          exportedBy: authCheck.user.username,
          counts: {
            users: users.length,
            items: items.length,
            categories: categories.length,
            departments: departments.length,
            customers: customers.length,
            invoices: invoices.length,
            receipts: receipts.length,
            transactions: transactions.length,
            auditLogs: auditLogs.length
          }
        },
        data: {
          users,
          categories,
          departments,
          customers,
          items,
          invoices,
          receipts,
          transactions,
          auditLogs
        }
      };
    } else {
      const localDb = readDb();
      backupPayload = {
        metadata: {
          system: 'Roong Aroon International School - Stock Management System',
          exportedAt,
          version: '1.0.0',
          exportedBy: authCheck.user.username,
          counts: {
            items: (localDb.items || []).length,
            categories: (localDb.categories || []).length,
            departments: (localDb.departments || []).length,
            customers: (localDb.customers || []).length,
            invoices: (localDb.invoices || []).length,
            receipts: (localDb.receipts || []).length,
            transactions: (localDb.transactions || []).length,
            auditLogs: (localDb.auditLogs || []).length
          }
        },
        data: {
          categories: localDb.categories || [],
          departments: localDb.departments || [],
          customers: localDb.customers || [],
          items: localDb.items || [],
          invoices: localDb.invoices || [],
          receipts: localDb.receipts || [],
          transactions: localDb.transactions || [],
          auditLogs: localDb.auditLogs || []
        }
      };
    }

    await logAuditEvent({
      category: 'SYSTEM',
      action: 'EXPORT_DATABASE_BACKUP',
      details: `Full database JSON snapshot exported by ${authCheck.user.username} at ${exportedAt}`,
      actorName: authCheck.user.name || authCheck.user.username,
      actorEmail: authCheck.user.email,
      metadata: {
        timestamp: exportedAt
      }
    });

    return NextResponse.json(backupPayload, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup_rais_inventory_${exportedAt.replace(/[:.]/g, '-').substring(0, 19)}.json"`
      }
    });
  } catch (error: any) {
    console.error('Backup export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate backup export: ' + (error?.message || 'Internal server error') },
      { status: 500 }
    );
  }
}
