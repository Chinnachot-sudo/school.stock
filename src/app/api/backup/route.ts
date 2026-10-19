import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { isServiceRoleConfigured, isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { requireAnyPermission } from '@/lib/auth-server';
import { logAuditEvent } from '@/lib/audit';

const PAGE_SIZE = 500;
const TABLES = [
  { name: 'items', order: ['id'] },
  { name: 'categories', order: ['id'] },
  { name: 'departments', order: ['id'] },
  { name: 'customers', order: ['id'] },
  { name: 'invoices', order: ['id'] },
  { name: 'receipts', order: ['id'] },
  { name: 'receipt_returns', order: ['id'] },
  { name: 'transactions', order: ['id'] },
  { name: 'audit_logs', order: ['id'], output: 'auditLogs' },
  { name: 'app_users', order: ['id'], output: 'users', columns: 'id,username,name,email,role,created_at,updated_at' },
  { name: 'user_roles', order: ['id'] },
  { name: 'roles', order: ['id'] },
  { name: 'permissions', order: ['id'] },
  { name: 'role_permissions', order: ['role_id', 'permission_id'] }
] as const;

type BackupRow = Record<string, unknown>;
type TableSpec = (typeof TABLES)[number];

async function fetchCompleteTable(table: TableSpec): Promise<BackupRow[]> {
  const rows: BackupRow[] = [];
  let expectedCount: number | null = null;

  for (let offset = 0; ; offset += PAGE_SIZE) {
    let query = supabase
      .from(table.name)
      .select('columns' in table ? table.columns : '*', { count: 'exact' });
    for (const column of table.order) query = query.order(column);

    const { data, error, count } = await query.range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(`Backup of ${table.name} failed: ${error.message}`);
    if (!Array.isArray(data) || typeof count !== 'number') {
      throw new Error(`Backup of ${table.name} returned an incomplete response`);
    }
    if (expectedCount === null) expectedCount = count;
    if (count !== expectedCount) {
      throw new Error(`Backup of ${table.name} changed during export; please retry`);
    }

    rows.push(...data);
    if (rows.length === expectedCount) {
      const uniqueKeys = new Set(rows.map(row => table.order.map(column => String(row[column])).join('\u0000')));
      if (uniqueKeys.size !== rows.length) {
        throw new Error(`Backup of ${table.name} contains duplicate rows; please retry`);
      }
      return rows;
    }
    if (data.length === 0 || rows.length > expectedCount) {
      throw new Error(`Backup of ${table.name} is incomplete; please retry`);
    }
  }
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const raw = typeof value === 'object' ? JSON.stringify(value) : String(value);
  // Avoid spreadsheet formula execution when opening an exported CSV.
  const safe = typeof value === 'string' && /^[\s]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

function toCsv(rows: BackupRow[]): string {
  if (rows.length === 0) return '';
  const headers = [...new Set(rows.flatMap(row => Object.keys(row)))].sort();
  return [
    headers.map(csvCell).join(','),
    ...rows.map(row => headers.map(header => csvCell(row[header])).join(','))
  ].join('\r\n');
}

export async function GET(request: Request) {
  try {
    const authCheck = await requireAnyPermission(request, ['iam:settings:configure', 'report:export']);
    if (authCheck.errorResponse) return authCheck.errorResponse;

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const tableName = searchParams.get('table');
    if (format !== 'json' && format !== 'csv') {
      return NextResponse.json({ error: 'Supported backup formats are json and csv' }, { status: 400 });
    }
    const csvTable = TABLES.find(table => table.name === tableName);
    if (format === 'csv' && !csvTable) {
      return NextResponse.json({ error: 'A valid table is required for CSV export' }, { status: 400 });
    }

    const exportedAt = new Date().toISOString();
    const stamp = exportedAt.replace(/[:.]/g, '-').slice(0, 19);
    let data: Record<string, BackupRow[]>;

    if (isSupabaseConfigured && !isServiceRoleConfigured) {
      return NextResponse.json({ error: 'Backup requires a Supabase service role connection.' }, { status: 503 });
    }

    if (isSupabaseConfigured && supabase) {
      const requestedTables = csvTable && format === 'csv' ? [csvTable] : [...TABLES];
      const results = await Promise.all(requestedTables.map(async table => [
        'output' in table ? table.output : table.name,
        await fetchCompleteTable(table)
      ] as const));
      data = Object.fromEntries(results);
    } else {
      const local = readDb();
      data = {
        items: local.items as unknown as BackupRow[],
        categories: local.categories as unknown as BackupRow[],
        departments: local.departments as unknown as BackupRow[],
        customers: local.customers as unknown as BackupRow[],
        invoices: local.invoices as unknown as BackupRow[],
        receipts: local.receipts as unknown as BackupRow[],
        transactions: local.transactions as unknown as BackupRow[],
        auditLogs: (local.auditLogs || []) as unknown as BackupRow[]
      };
      if (csvTable && !data['output' in csvTable ? csvTable.output : csvTable.name]) {
        return NextResponse.json({ error: 'Requested table is unavailable in local development mode.' }, { status: 400 });
      }
    }

    await logAuditEvent({
      category: 'SYSTEM',
      action: 'EXPORT_DATABASE_BACKUP',
      details: `${format.toUpperCase()} backup exported by ${authCheck.user.username} at ${exportedAt}`,
      actorName: authCheck.user.name || authCheck.user.username,
      actorEmail: authCheck.user.email,
      metadata: { format, table: format === 'csv' ? tableName : undefined, counts: Object.fromEntries(Object.entries(data).map(([name, rows]) => [name, rows.length])) }
    });

    const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
    if (format === 'csv' && csvTable) {
      return new NextResponse(toCsv(data['output' in csvTable ? csvTable.output : csvTable.name] || []), {
        headers: {
          ...headers,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="backup_rais_${csvTable.name}_${stamp}.csv"`
        }
      });
    }

    return NextResponse.json({
      metadata: {
        system: 'Roong Aroon International School - Stock Management System',
        exportedAt,
        version: '1.0.0',
        exportedBy: authCheck.user.username,
        source: isSupabaseConfigured ? 'supabase' : 'local-development',
        consistency: 'Row counts and keys checked per table; exports are not a single database transaction',
        counts: Object.fromEntries(Object.entries(data).map(([name, rows]) => [name, rows.length])),
        excluded: ['password_hash', 'login_rate_limits']
      },
      data
    }, {
      headers: {
        ...headers,
        'Content-Disposition': `attachment; filename="backup_rais_inventory_${stamp}.json"`
      }
    });
  } catch (error: any) {
    console.error('Backup export error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to generate backup export' }, { status: 500 });
  }
}
