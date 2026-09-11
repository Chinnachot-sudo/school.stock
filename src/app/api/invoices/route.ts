import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Invoice, InvoiceItem } from '@/types/inventory';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.toLowerCase() || '';
    const status = searchParams.get('status');

    // 1. Try Supabase Cloud DB first if configured
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });
        if (status && status !== 'ALL') query = query.eq('status', status);

        const { data, error } = await query;
        if (!error && data) {
          let invoices: Invoice[] = data.map((row: any) => ({
            id: row.id,
            invoiceNumber: row.invoice_number,
            customerName: row.customer_name,
            customerType: row.customer_type,
            studentClass: row.student_class,
            studentId: row.student_id,
            parentName: row.parent_name,
            phone: row.phone,
            dueDate: row.due_date,
            items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
            subtotal: Number(row.subtotal) || 0,
            discount: Number(row.discount) || 0,
            totalAmount: Number(row.total_amount) || 0,
            creatorName: row.creator_name,
            creatorEmail: row.creator_email,
            note: row.note,
            status: row.status || 'PENDING',
            receiptId: row.receipt_id,
            paidAt: row.paid_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }));

          if (search) {
            invoices = invoices.filter(
              inv =>
                inv.invoiceNumber.toLowerCase().includes(search) ||
                inv.customerName.toLowerCase().includes(search) ||
                (inv.studentClass && inv.studentClass.toLowerCase().includes(search)) ||
                (inv.studentId && inv.studentId.includes(search)) ||
                (inv.parentName && inv.parentName.toLowerCase().includes(search))
            );
          }

          const pendingInvoices = invoices.filter(i => i.status === 'PENDING');
          const paidInvoices = invoices.filter(i => i.status === 'PAID');
          const totalPending = pendingInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
          const totalPaid = paidInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

          return NextResponse.json({
            invoices,
            summary: {
              totalPending,
              totalPaid,
              countPending: pendingInvoices.length,
              countPaid: paidInvoices.length,
              countTotal: invoices.length
            }
          });
        }
      } catch (sbErr) {
        console.warn('Supabase fetch invoices warning, falling back to local DB:', sbErr);
      }
    }

    // 2. Fallback to Local JSON DB
    const db = readDb();
    let invoices = (db.invoices || []).slice().reverse();

    if (status && status !== 'ALL') {
      invoices = invoices.filter(inv => inv.status === status);
    }

    if (search) {
      invoices = invoices.filter(
        inv =>
          inv.invoiceNumber.toLowerCase().includes(search) ||
          inv.customerName.toLowerCase().includes(search) ||
          (inv.studentClass && inv.studentClass.toLowerCase().includes(search)) ||
          (inv.studentId && inv.studentId.includes(search)) ||
          (inv.parentName && inv.parentName.toLowerCase().includes(search))
      );
    }

    const pendingInvoices = invoices.filter(i => i.status === 'PENDING');
    const paidInvoices = invoices.filter(i => i.status === 'PAID');
    const totalPending = pendingInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalPaid = paidInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

    return NextResponse.json({
      invoices,
      summary: {
        totalPending,
        totalPaid,
        countPending: pendingInvoices.length,
        countPaid: paidInvoices.length,
        countTotal: invoices.length
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerType = 'STUDENT',
      studentClass,
      studentId,
      parentName,
      phone,
      dueDate,
      items,
      discount = 0,
      creatorName = 'เจ้าหน้าที่พัสดุ / การเงิน',
      creatorEmail = '',
      note
    } = body;

    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อผู้รับใบแจ้งชำระ / นักเรียน' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'กรุณาใส่รายการอย่างน้อย 1 รายการ' }, { status: 400 });
    }

    const db = readDb();
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');

    let seq = 1;
    if (isSupabaseConfigured && supabase) {
      try {
        const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true });
        if (typeof count === 'number' && !isNaN(count)) seq = count + 1;
      } catch {
        seq = (db.invoices?.length || 0) + 1;
      }
    } else {
      seq = (db.invoices?.length || 0) + 1;
    }

    const countSeq = seq.toString().padStart(4, '0');
    const invoiceNumber = `INV${yy}${mm}-${countSeq}`;
    const invoiceId = `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let subtotal = 0;
    const validatedItems: InvoiceItem[] = [];

    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
      const lineTotal = qty * unitPrice;
      subtotal += lineTotal;

      validatedItems.push({
        itemId: item.itemId || undefined,
        itemCode: item.itemCode || undefined,
        itemName: (item.itemName || 'รายการค่าใช้จ่าย').trim(),
        quantity: qty,
        unitPrice,
        unit: item.unit || 'ชิ้น',
        totalPrice: lineTotal
      });
    }

    const discountAmount = Math.max(0, Number(discount) || 0);
    const totalAmount = Math.max(0, subtotal - discountAmount);

    // Default due date: 7 days from now if not provided
    const defaultDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      customerName: customerName.trim(),
      customerType,
      studentClass: studentClass?.trim() || undefined,
      studentId: studentId?.trim() || undefined,
      parentName: parentName?.trim() || undefined,
      phone: phone?.trim() || undefined,
      dueDate: dueDate || defaultDueDate,
      items: validatedItems,
      subtotal,
      discount: discountAmount,
      totalAmount,
      creatorName: creatorName.trim(),
      creatorEmail: creatorEmail.trim(),
      note: note?.trim() || undefined,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Supabase Cloud DB insert (if table exists)
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('invoices').insert({
          id: newInvoice.id,
          invoice_number: newInvoice.invoiceNumber,
          customer_name: newInvoice.customerName,
          customer_type: newInvoice.customerType,
          student_class: newInvoice.studentClass,
          student_id: newInvoice.studentId,
          parent_name: newInvoice.parentName,
          phone: newInvoice.phone,
          due_date: newInvoice.dueDate,
          items: JSON.stringify(newInvoice.items),
          subtotal: newInvoice.subtotal,
          discount: newInvoice.discount,
          total_amount: newInvoice.totalAmount,
          creator_name: newInvoice.creatorName,
          creator_email: newInvoice.creatorEmail,
          note: newInvoice.note,
          status: 'PENDING',
          created_at: newInvoice.createdAt,
          updated_at: newInvoice.updatedAt
        });
      } catch (sbErr) {
        console.warn('Supabase invoice insert warning:', sbErr);
      }
    }

    // 2. Local DB update
    try {
      if (!db.invoices) db.invoices = [];
      db.invoices.push(newInvoice);
      writeDb(db);
    } catch (localErr) {
      console.warn('Local db invoice write skipped:', localErr);
    }

    return NextResponse.json({
      success: true,
      invoice: newInvoice
    });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: error.message || 'Failed to create invoice' }, { status: 500 });
  }
}
