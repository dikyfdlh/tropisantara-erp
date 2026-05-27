'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireRole, requireSuperAdmin } from '@/lib/rbac';
import { nextCode } from '@/lib/codegen';
import { addDays } from 'date-fns';

const STATUSES = ['DRAFT', 'CONFIRMED', 'DELIVERED', 'INVOICED', 'PAID', 'CANCELLED'] as const;

const itemSchema = z.object({
  productId: z.string().min(1),
  qty: z.coerce.number().positive(),
  unitPrice: z.coerce.number().int().min(0),
  discount: z.coerce.number().int().min(0).default(0),
});

const schema = z.object({
  customerId: z.string().min(1),
  orderDate: z.string().min(1),
  deliveryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  taxRate: z.coerce.number().min(0).max(100).default(11),
  items: z.array(itemSchema).min(1, 'Tambahkan minimal 1 item'),
});

function parseItems(fd: FormData) {
  const ids = fd.getAll('itemProductId').map(String);
  const qtys = fd.getAll('itemQty').map(String);
  const prices = fd.getAll('itemPrice').map(String);
  const discs = fd.getAll('itemDiscount').map(String);
  const items: { productId: string; qty: number; unitPrice: number; discount: number }[] = [];
  for (let i = 0; i < ids.length; i++) {
    if (!ids[i]) continue;
    items.push({
      productId: ids[i],
      qty: parseFloat(qtys[i] || '0'),
      unitPrice: parseInt(prices[i] || '0', 10) || 0,
      discount: parseInt(discs[i] || '0', 10) || 0,
    });
  }
  return items;
}

function compute(items: { qty: number; unitPrice: number; discount: number }[], taxRate: number) {
  const itemRows = items.map((it) => {
    const gross = Math.round(it.qty * it.unitPrice);
    const total = Math.max(0, gross - it.discount);
    return { ...it, total };
  });
  const subtotal = itemRows.reduce((s, r) => s + r.total, 0);
  const tax = Math.round((subtotal * taxRate) / 100);
  const total = subtotal + tax;
  return { itemRows, subtotal, tax, total };
}

export async function createSalesOrder(fd: FormData) {
  const user = await requireRole(['ADMIN', 'SALES']);
  const data = schema.parse({
    customerId: fd.get('customerId'),
    orderDate: fd.get('orderDate'),
    deliveryDate: fd.get('deliveryDate') || null,
    notes: fd.get('notes') || null,
    taxRate: fd.get('taxRate') || 11,
    items: parseItems(fd),
  });
  const { itemRows, subtotal, tax, total } = compute(data.items, data.taxRate);

  const code = await nextCode('SO');
  await db.salesOrder.create({
    data: {
      code,
      customerId: data.customerId,
      orderDate: new Date(data.orderDate),
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
      notes: data.notes,
      taxRate: data.taxRate,
      subtotal, tax, total,
      createdById: user.id,
      items: { create: itemRows.map((it) => ({
        productId: it.productId, qty: it.qty, unitPrice: it.unitPrice, discount: it.discount, total: it.total,
      })) },
    },
  });
  revalidatePath('/perdagangan/sales-orders');
  redirect('/perdagangan/sales-orders');
}

export async function updateSalesOrderStatus(id: string, fd: FormData) {
  await requireRole(['ADMIN', 'SALES']);
  const status = String(fd.get('status') ?? '');
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) throw new Error('Status invalid');
  await db.salesOrder.update({ where: { id }, data: { status } });
  revalidatePath(`/perdagangan/sales-orders/${id}`);
}

/**
 * Hapus Sales Order beserta items, delivery orders, invoices, dan payments-nya.
 * Khusus SUPER_ADMIN.
 */
export async function deleteSalesOrder(id: string) {
  await requireSuperAdmin();
  await db.$transaction(async (tx) => {
    const invoices = await tx.invoice.findMany({ where: { salesOrderId: id }, select: { id: true } });
    const invIds = invoices.map((i) => i.id);
    if (invIds.length > 0) {
      await tx.payment.deleteMany({ where: { invoiceId: { in: invIds } } });
      await tx.invoice.deleteMany({ where: { id: { in: invIds } } });
    }
    await tx.deliveryOrder.deleteMany({ where: { salesOrderId: id } });
    // SalesOrderItem dihapus otomatis lewat onDelete: Cascade pada relasi.
    await tx.salesOrder.delete({ where: { id } });
  });
  revalidatePath('/perdagangan/sales-orders');
  revalidatePath('/perdagangan/invoices');
  revalidatePath('/keuangan/ar');
  redirect('/perdagangan/sales-orders');
}

export async function generateInvoice(id: string) {
  await requireRole(['ADMIN', 'SALES', 'ACCOUNTING']);
  const so = await db.salesOrder.findUnique({ where: { id }, include: { customer: true } });
  if (!so) throw new Error('SO tidak ditemukan');
  const code = await nextCode('INV');
  const inv = await db.invoice.create({
    data: {
      code,
      salesOrderId: so.id,
      total: so.total,
      date: new Date(),
      dueDate: addDays(new Date(), so.customer.paymentTerm),
    },
  });
  await db.salesOrder.update({ where: { id }, data: { status: 'INVOICED' } });
  revalidatePath('/perdagangan/sales-orders');
  revalidatePath('/perdagangan/invoices');
  redirect(`/perdagangan/invoices/${inv.id}`);
}
