'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireRole, requireSuperAdmin } from '@/lib/rbac';
import { nextCode } from '@/lib/codegen';

const STATUSES = ['DRAFT', 'SENT', 'PARTIAL', 'RECEIVED', 'PAID', 'CANCELLED'] as const;

const itemSchema = z.object({
  productId: z.string().min(1),
  qty: z.coerce.number().positive(),
  unitPrice: z.coerce.number().int().min(0),
});

const schema = z.object({
  supplierId: z.string().min(1),
  orderDate: z.string().min(1),
  expectedDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  taxRate: z.coerce.number().min(0).max(100).default(11),
  items: z.array(itemSchema).min(1),
});

function parseItems(fd: FormData) {
  const ids = fd.getAll('itemProductId').map(String);
  const qtys = fd.getAll('itemQty').map(String);
  const prices = fd.getAll('itemPrice').map(String);
  const items: { productId: string; qty: number; unitPrice: number }[] = [];
  for (let i = 0; i < ids.length; i++) {
    if (!ids[i]) continue;
    items.push({
      productId: ids[i],
      qty: parseFloat(qtys[i] || '0'),
      unitPrice: parseInt(prices[i] || '0', 10) || 0,
    });
  }
  return items;
}

export async function createPurchaseOrder(fd: FormData) {
  const user = await requireRole(['ADMIN', 'PURCHASING']);
  const data = schema.parse({
    supplierId: fd.get('supplierId'),
    orderDate: fd.get('orderDate'),
    expectedDate: fd.get('expectedDate') || null,
    notes: fd.get('notes') || null,
    taxRate: fd.get('taxRate') || 11,
    items: parseItems(fd),
  });
  const itemRows = data.items.map((it) => ({ ...it, total: Math.round(it.qty * it.unitPrice) }));
  const subtotal = itemRows.reduce((s, r) => s + r.total, 0);
  const tax = Math.round((subtotal * data.taxRate) / 100);
  const total = subtotal + tax;

  const code = await nextCode('PO');
  await db.purchaseOrder.create({
    data: {
      code,
      supplierId: data.supplierId,
      orderDate: new Date(data.orderDate),
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
      notes: data.notes,
      taxRate: data.taxRate, subtotal, tax, total,
      createdById: user.id,
      items: { create: itemRows },
    },
  });
  revalidatePath('/perdagangan/purchase-orders');
  redirect('/perdagangan/purchase-orders');
}

/**
 * Hapus Purchase Order beserta items dan goods receipts-nya. Khusus SUPER_ADMIN.
 */
export async function deletePurchaseOrder(id: string) {
  await requireSuperAdmin();
  await db.$transaction(async (tx) => {
    await tx.goodsReceipt.deleteMany({ where: { purchaseOrderId: id } });
    // PurchaseOrderItem dihapus otomatis lewat onDelete: Cascade.
    await tx.purchaseOrder.delete({ where: { id } });
  });
  revalidatePath('/perdagangan/purchase-orders');
  revalidatePath('/keuangan/ap');
  redirect('/perdagangan/purchase-orders');
}

export async function updatePOStatus(id: string, fd: FormData) {
  await requireRole(['ADMIN', 'PURCHASING']);
  const status = String(fd.get('status') ?? '');
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) throw new Error('Status invalid');
  await db.purchaseOrder.update({ where: { id }, data: { status } });
  revalidatePath(`/perdagangan/purchase-orders/${id}`);
}

const poMethodSchema = z.object({ paymentMethod: z.enum(['CASH', 'TRANSFER', 'GIRO', 'COD']) });

export async function updatePOPaymentMethod(id: string, fd: FormData) {
  await requireRole(['ADMIN', 'PURCHASING', 'ACCOUNTING']);
  const { paymentMethod } = poMethodSchema.parse({ paymentMethod: fd.get('paymentMethod') });
  await db.purchaseOrder.update({ where: { id }, data: { paymentMethod } });
  revalidatePath(`/perdagangan/purchase-orders/${id}`);
}

const supplierPaymentSchema = z.object({
  amount: z.coerce.number().int().positive(),
  method: z.enum(['CASH', 'TRANSFER', 'GIRO', 'COD']).default('TRANSFER'),
  reference: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * Catat pembayaran ke supplier. Saat akumulasi `paid` >= `total`, PO otomatis
 * berstatus PAID dan `paidAt` ditandai — mempengaruhi laporan Hutang (AP).
 */
export async function recordSupplierPayment(purchaseOrderId: string, fd: FormData) {
  await requireRole(['ADMIN', 'PURCHASING', 'ACCOUNTING']);
  const data = supplierPaymentSchema.parse({
    amount: fd.get('amount'),
    method: fd.get('method') || 'TRANSFER',
    reference: fd.get('reference') || null,
    date: fd.get('date') || null,
    notes: fd.get('notes') || null,
  });

  await db.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({ where: { id: purchaseOrderId } });
    if (!po) throw new Error('PO tidak ditemukan');

    const remaining = po.total - po.paid;
    if (data.amount > remaining) {
      throw new Error(`Jumlah melebihi sisa hutang (sisa: Rp ${remaining.toLocaleString('id-ID')}).`);
    }

    await tx.supplierPayment.create({
      data: {
        purchaseOrderId,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
        date: data.date ? new Date(data.date) : new Date(),
        notes: data.notes,
      },
    });

    const newPaid = po.paid + data.amount;
    const isPaid = newPaid >= po.total;
    await tx.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        paid: newPaid,
        status: isPaid ? 'PAID' : po.status === 'PAID' ? 'PAID' : po.status,
        paidAt: isPaid ? new Date() : po.paidAt,
      },
    });
  });

  revalidatePath(`/perdagangan/purchase-orders/${purchaseOrderId}`);
  revalidatePath('/perdagangan/purchase-orders');
  revalidatePath('/keuangan/ap');
  revalidatePath('/keuangan/cashflow');
  revalidatePath('/dashboard');
}

/**
 * Hapus satu pembayaran ke supplier — me-rollback `paid` PO.
 * Khusus ADMIN/ACCOUNTING (atau SUPER_ADMIN otomatis).
 */
export async function deleteSupplierPayment(paymentId: string) {
  await requireRole(['ADMIN', 'ACCOUNTING']);
  await db.$transaction(async (tx) => {
    const pay = await tx.supplierPayment.findUnique({ where: { id: paymentId } });
    if (!pay) return;
    const po = await tx.purchaseOrder.findUnique({ where: { id: pay.purchaseOrderId } });
    if (!po) return;
    const newPaid = Math.max(0, po.paid - pay.amount);
    await tx.supplierPayment.delete({ where: { id: paymentId } });
    await tx.purchaseOrder.update({
      where: { id: po.id },
      data: {
        paid: newPaid,
        status: po.status === 'PAID' && newPaid < po.total ? 'RECEIVED' : po.status,
        paidAt: newPaid < po.total ? null : po.paidAt,
      },
    });
  });
  revalidatePath('/perdagangan/purchase-orders');
  revalidatePath('/keuangan/ap');
  revalidatePath('/keuangan/cashflow');
}
