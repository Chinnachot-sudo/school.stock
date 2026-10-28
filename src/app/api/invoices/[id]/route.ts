import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Invoice } from '@/types/inventory';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { requirePermission } from '@/lib/auth-server';
import { logAuditEvent } from '@/lib/audit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requirePermission(request, 'pos:receipt:read');
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const { id } = await params;
    const cleanId = (id || '').trim().replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!cleanId) {
      return NextResponse.json({ error: 'Valid invoice ID or number is required' }, { status: 400 });
    }

    // 1. Supabase
    if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .or(`id.eq.${cleanId},invoice_number.eq.${cleanId}`)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          const invoice: Invoice = {
            id: data.id,
            invoiceNumber: data.invoice_number,
            customerName: data.customer_name,
            customerType: data.customer_type,
            studentClass: data.student_class,
            studentId: data.student_id,
            parentName: data.parent_name,
            phone: data.phone,
            dueDate: data.due_date,
            items: typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || []),
            subtotal: Number(data.subtotal) || 0,
            discount: Number(data.discount) || 0,
            totalAmount: Number(data.total_amount) || 0,
            creatorName: data.creator_name,
            creatorEmail: data.creator_email,
            note: data.note,
            status: data.status || 'PENDING',
            receiptId: data.receipt_id,
            paidAt: data.paid_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
          return NextResponse.json({ invoice });
        }
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // 2. Local DB
    const db = readDb();
    const invoice = (db.invoices || []).find(i => i.id === id || i.invoiceNumber === id);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requirePermission(request, 'pos:receipt:create');
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const { id } = await params;
    const cleanId = (id || '').trim().replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!cleanId) {
      return NextResponse.json({ error: 'Valid invoice ID or number is required' }, { status: 400 });
    }

    const body = await request.json();
    const { status, receiptId, paidAt, note } = body;

    const now = new Date().toISOString();
    const updates: Partial<Invoice> = {
      updatedAt: now
    };

    if (status) updates.status = status;
    if (receiptId !== undefined) updates.receiptId = receiptId;
    if (paidAt !== undefined) updates.paidAt = paidAt;
    if (note !== undefined) updates.note = note;

    // 1. Supabase
    if (isSupabaseConfigured && supabase) {
      const sbUpdates: any = { updated_at: now };
      if (status) sbUpdates.status = status;
      if (receiptId !== undefined) sbUpdates.receipt_id = receiptId;
      if (paidAt !== undefined) sbUpdates.paid_at = paidAt;
      if (note !== undefined) sbUpdates.note = note;

      const { data, error } = await supabase
        .from('invoices')
        .update(sbUpdates)
        .or(`id.eq.${cleanId},invoice_number.eq.${cleanId}`)
        .select()
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

      await logAuditEvent({ category: 'POS_SALE', action: 'UPDATE_INVOICE', details: `Updated invoice ${data.invoice_number}`, actorId: authCheck.user.id, actorName: authCheck.user.name || authCheck.user.username, actorEmail: authCheck.user.email, targetId: data.id, targetName: data.invoice_number, metadata: { fields: Object.keys(sbUpdates), status: data.status } });

      return NextResponse.json({ success: true, invoice: data });
    }

    // 2. Local DB
    const db = readDb();
    const idx = (db.invoices || []).findIndex(i => i.id === cleanId || i.invoiceNumber === cleanId);
    if (idx !== -1) {
      db.invoices[idx] = { ...db.invoices[idx], ...updates };
      writeDb(db);
      await logAuditEvent({ category: 'POS_SALE', action: 'UPDATE_INVOICE', details: `Updated invoice ${db.invoices[idx].invoiceNumber}`, actorId: authCheck.user.id, actorName: authCheck.user.name || authCheck.user.username, targetId: db.invoices[idx].id, targetName: db.invoices[idx].invoiceNumber, metadata: { fields: Object.keys(updates), status: db.invoices[idx].status } });
      return NextResponse.json({ success: true, invoice: db.invoices[idx] });
    }

    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: error.message || 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requirePermission(request, 'pos:receipt:void');
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const { id } = await params;
    const cleanId = (id || '').trim().replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!cleanId) {
      return NextResponse.json({ error: 'Valid invoice ID or number is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = body?.reason || 'Invoice cancelled';
    const now = new Date().toISOString();

    // 1. Supabase
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          status: 'CANCELLED',
          note: reason,
          updated_at: now
        })
        .or(`id.eq.${cleanId},invoice_number.eq.${cleanId}`)
        .select()
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

      await logAuditEvent({ category: 'POS_SALE', action: 'CANCEL_INVOICE', details: `Cancelled invoice ${data.invoice_number}`, actorId: authCheck.user.id, actorName: authCheck.user.name || authCheck.user.username, actorEmail: authCheck.user.email, targetId: data.id, targetName: data.invoice_number, metadata: { reason } });

      return NextResponse.json({ success: true, invoice: data });
    }

    // 2. Local DB
    const db = readDb();
    const idx = (db.invoices || []).findIndex(i => i.id === cleanId || i.invoiceNumber === cleanId);
    if (idx !== -1) {
      db.invoices[idx].status = 'CANCELLED';
      db.invoices[idx].note = reason;
      db.invoices[idx].updatedAt = now;
      writeDb(db);
      await logAuditEvent({ category: 'POS_SALE', action: 'CANCEL_INVOICE', details: `Cancelled invoice ${db.invoices[idx].invoiceNumber}`, actorId: authCheck.user.id, actorName: authCheck.user.name || authCheck.user.username, targetId: db.invoices[idx].id, targetName: db.invoices[idx].invoiceNumber, metadata: { reason } });
      return NextResponse.json({ success: true, invoice: db.invoices[idx] });
    }

    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Error cancelling invoice:', error);
    return NextResponse.json({ error: error.message || 'Failed to cancel invoice' }, { status: 500 });
  }
}
