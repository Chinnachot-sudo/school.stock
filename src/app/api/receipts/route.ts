import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Item, Receipt, ReceiptItem, Transaction } from '@/types/inventory';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.toLowerCase() || '';
    const paymentMethod = searchParams.get('paymentMethod');
    const customerType = searchParams.get('customerType');
    const status = searchParams.get('status');

    // 1. Supabase Cloud DB
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('receipts').select('*').order('created_at', { ascending: false });

      if (paymentMethod && paymentMethod !== 'ALL') query = query.eq('payment_method', paymentMethod);
      if (customerType && customerType !== 'ALL') query = query.eq('customer_type', customerType);
      if (status && status !== 'ALL') query = query.eq('status', status);

      const { data, error } = await query;
      if (!error && data) {
        let receipts: Receipt[] = data.map((row: any) => ({
          id: row.id,
          receiptNumber: row.receipt_number,
          customerName: row.customer_name,
          customerType: row.customer_type,
          studentClass: row.student_class,
          studentId: row.student_id,
          paymentMethod: row.payment_method,
          items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
          subtotal: Number(row.subtotal) || 0,
          discount: Number(row.discount) || 0,
          totalAmount: Number(row.total_amount) || 0,
          cashReceived: Number(row.cash_received) || 0,
          change: Number(row.change) || 0,
          cashierName: row.cashier_name,
          cashierEmail: row.cashier_email,
          note: row.note,
          status: row.status || 'COMPLETED',
          voidReason: row.void_reason,
          createdAt: row.created_at
        }));

        if (search) {
          receipts = receipts.filter(
            r =>
              r.receiptNumber.toLowerCase().includes(search) ||
              r.customerName.toLowerCase().includes(search) ||
              (r.studentClass && r.studentClass.toLowerCase().includes(search)) ||
              (r.studentId && r.studentId.includes(search))
          );
        }

        // Calculate summary
        const activeReceipts = receipts.filter(r => r.status === 'COMPLETED');
        const totalSales = activeReceipts.reduce((sum, r) => sum + r.totalAmount, 0);
        const totalCash = activeReceipts.filter(r => r.paymentMethod === 'CASH').reduce((sum, r) => sum + r.totalAmount, 0);
        const totalPromptPay = activeReceipts.filter(r => r.paymentMethod === 'PROMPTPAY').reduce((sum, r) => sum + r.totalAmount, 0);

        return NextResponse.json({
          receipts,
          summary: {
            totalSales,
            totalCash,
            totalPromptPay,
            count: activeReceipts.length
          }
        });
      }
    }

    // 2. Fallback to Local JSON DB
    const db = readDb();
    let receipts = (db.receipts || []).slice().reverse();

    if (paymentMethod && paymentMethod !== 'ALL') {
      receipts = receipts.filter(r => r.paymentMethod === paymentMethod);
    }
    if (customerType && customerType !== 'ALL') {
      receipts = receipts.filter(r => r.customerType === customerType);
    }
    if (status && status !== 'ALL') {
      receipts = receipts.filter(r => r.status === status);
    }

    if (search) {
      receipts = receipts.filter(
        r =>
          r.receiptNumber.toLowerCase().includes(search) ||
          r.customerName.toLowerCase().includes(search) ||
          (r.studentClass && r.studentClass.toLowerCase().includes(search)) ||
          (r.studentId && r.studentId.includes(search))
      );
    }

    const activeReceipts = receipts.filter(r => r.status === 'COMPLETED');
    const totalSales = activeReceipts.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalCash = activeReceipts.filter(r => r.paymentMethod === 'CASH').reduce((sum, r) => sum + r.totalAmount, 0);
    const totalPromptPay = activeReceipts.filter(r => r.paymentMethod === 'PROMPTPAY').reduce((sum, r) => sum + r.totalAmount, 0);

    return NextResponse.json({
      receipts,
      summary: {
        totalSales,
        totalCash,
        totalPromptPay,
        count: activeReceipts.length
      }
    });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 });
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
      paymentMethod = 'CASH',
      items,
      discount = 0,
      cashReceived,
      change,
      cashierName = 'จนท. สหกรณ์',
      cashierEmail = '',
      note
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ' }, { status: 400 });
    }

    // 1. Fetch items from Supabase if configured, or fall back to local DB
    let cloudItems: Item[] = [];
    if (isSupabaseConfigured && supabase) {
      const itemIds = items.map((ci: any) => ci.itemId).filter(Boolean);
      const itemCodes = items.map((ci: any) => ci.itemCode).filter(Boolean);

      const { data: sbItems } = await supabase
        .from('items')
        .select('*')
        .in('id', itemIds);

      if (sbItems) {
        for (const row of sbItems) {
          cloudItems.push({
            id: row.id,
            code: row.code,
            name: row.name,
            categoryId: row.category_id,
            currentStock: Number(row.current_stock) || 0,
            minStock: Number(row.min_stock) || 5,
            unit: row.unit || 'ชิ้น',
            price: Number(row.price) || 0,
            cost: Number(row.cost) || 0,
            location: row.location || '',
            isForSale: Boolean(row.is_for_sale),
            note: row.note || '',
            isBorrowable: Boolean(row.is_borrowable),
            updatedAt: row.updated_at
          });
        }
      }

      // If any items were not found by id, query by code
      const missingCodes = itemCodes.filter(c => !cloudItems.some(i => i.code === c));
      if (missingCodes.length > 0) {
        const { data: codeItems } = await supabase
          .from('items')
          .select('*')
          .in('code', missingCodes);

        if (codeItems) {
          for (const row of codeItems) {
            if (!cloudItems.some(i => i.id === row.id)) {
              cloudItems.push({
                id: row.id,
                code: row.code,
                name: row.name,
                categoryId: row.category_id,
                currentStock: Number(row.current_stock) || 0,
                minStock: Number(row.min_stock) || 5,
                unit: row.unit || 'ชิ้น',
                price: Number(row.price) || 0,
                cost: Number(row.cost) || 0,
                location: row.location || '',
                isForSale: Boolean(row.is_for_sale),
                note: row.note || '',
                isBorrowable: Boolean(row.is_borrowable),
                updatedAt: row.updated_at
              });
            }
          }
        }
      }
    }

    const db = readDb();
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');

    let seq = 1;
    if (isSupabaseConfigured && supabase) {
      try {
        const { count } = await supabase.from('receipts').select('*', { count: 'exact', head: true });
        if (typeof count === 'number' && !isNaN(count)) seq = count + 1;
      } catch {
        seq = (db.receipts?.length || 0) + 1;
      }
    } else {
      seq = (db.receipts?.length || 0) + 1;
    }

    const countSeq = seq.toString().padStart(4, '0');
    const receiptNumber = `RC${yy}${mm}-${countSeq}`;
    const receiptId = `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let subtotal = 0;
    const validatedReceiptItems: ReceiptItem[] = [];

    // 2. Validate items and stock against cloud or local database
    for (const cartItem of items) {
      const targetItem = cloudItems.find(i => i.id === cartItem.itemId || i.code === cartItem.itemCode)
        || db.items.find(i => i.id === cartItem.itemId || i.code === cartItem.itemCode);

      if (!targetItem) {
        return NextResponse.json({ error: `ไม่พบสินค้า: ${cartItem.itemName || cartItem.itemId}` }, { status: 404 });
      }

      const qty = Number(cartItem.quantity) || 1;
      if (targetItem.currentStock < qty) {
        return NextResponse.json(
          {
            error: `สินค้า "${targetItem.name}" ยอดสต็อกไม่พอ (คงเหลือ ${targetItem.currentStock} ${targetItem.unit} แต่ต้องการซื้อ ${qty} ${targetItem.unit})`
          },
          { status: 400 }
        );
      }

      const unitPrice = cartItem.unitPrice !== undefined ? Number(cartItem.unitPrice) : (targetItem.price || 0);
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;

      validatedReceiptItems.push({
        itemId: targetItem.id,
        itemCode: targetItem.code,
        itemName: targetItem.name,
        quantity: qty,
        unitPrice,
        unit: targetItem.unit,
        totalPrice: lineTotal
      });
    }

    const discountAmount = Math.max(0, Number(discount) || 0);
    const totalAmount = Math.max(0, subtotal - discountAmount);
    const received = paymentMethod === 'CASH' ? Number(cashReceived) || totalAmount : totalAmount;
    const changeAmount = paymentMethod === 'CASH' ? Math.max(0, received - totalAmount) : 0;

    const newReceipt: Receipt = {
      id: receiptId,
      receiptNumber,
      customerName: (customerName || 'ผู้ปกครอง / นักเรียน').trim(),
      customerType,
      studentClass: studentClass?.trim() || undefined,
      studentId: studentId?.trim() || undefined,
      paymentMethod,
      items: validatedReceiptItems,
      subtotal,
      discount: discountAmount,
      totalAmount,
      cashReceived: received,
      change: changeAmount,
      cashierName: cashierName.trim(),
      cashierEmail: cashierEmail.trim(),
      note: note?.trim() || undefined,
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    };

    // 3. Deduct stock and record transactions in Supabase Cloud DB
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('receipts').insert({
          id: newReceipt.id,
          receipt_number: newReceipt.receiptNumber,
          customer_name: newReceipt.customerName,
          customer_type: newReceipt.customerType,
          student_class: newReceipt.studentClass,
          student_id: newReceipt.studentId,
          payment_method: newReceipt.paymentMethod,
          items: JSON.stringify(newReceipt.items),
          subtotal: newReceipt.subtotal,
          discount: newReceipt.discount,
          total_amount: newReceipt.totalAmount,
          cash_received: newReceipt.cashReceived,
          change: newReceipt.change,
          cashier_name: newReceipt.cashierName,
          cashier_email: newReceipt.cashierEmail,
          note: newReceipt.note,
          status: 'COMPLETED',
          created_at: newReceipt.createdAt
        });

        for (const rItem of validatedReceiptItems) {
          const { data: cur } = await supabase
            .from('items')
            .select('current_stock')
            .eq('id', rItem.itemId)
            .maybeSingle();

          const newStock = cur ? Math.max(0, (cur.current_stock || 0) - rItem.quantity) : 0;

          await supabase
            .from('items')
            .update({ current_stock: newStock, updated_at: new Date().toISOString() })
            .eq('id', rItem.itemId);

          await supabase.from('transactions').insert({
            id: `tx-sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            item_id: rItem.itemId,
            item_name: rItem.itemName,
            item_code: rItem.itemCode,
            type: 'SALE',
            quantity: rItem.quantity,
            balance_after: newStock,
            department: 'School Store & Co-op',
            requester_name: newReceipt.customerName + (newReceipt.studentClass ? ` (${newReceipt.studentClass})` : ''),
            note: `ขายตามใบเสร็จ #${receiptNumber}`,
            receipt_id: newReceipt.id,
            created_at: new Date().toISOString()
          });
        }
      } catch (sbErr) {
        console.warn('Supabase sale insert warning:', sbErr);
      }
    }

    // 4. Safely update local DB as local cache
    try {
      for (const rItem of validatedReceiptItems) {
        const idx = db.items.findIndex(i => i.id === rItem.itemId);
        if (idx !== -1) {
          db.items[idx].currentStock = Math.max(0, db.items[idx].currentStock - rItem.quantity);
          db.items[idx].updatedAt = new Date().toISOString();
        }
      }
      if (!db.receipts) db.receipts = [];
      db.receipts.push(newReceipt);
      writeDb(db);
    } catch (localErr) {
      console.warn('Local db write skipped:', localErr);
    }

    return NextResponse.json({
      success: true,
      receipt: newReceipt
    });
  } catch (error: any) {
    console.error('Error creating receipt:', error);
    return NextResponse.json({ error: error.message || 'Failed to process sale' }, { status: 500 });
  }
}
