'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireRole, requireSuperAdmin } from '@/lib/rbac';

const paymentSchema = z.object({
  amount: z.coerce.number().int().positive(),
  method: z.string().default('TRANSFER'),
  reference: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const methodSchema = z.object({ paymentMethod: z.enum(['CASH', 'TRANSFER', 'GIRO', 'COD']) });

export async function updatePaymentMethod(invoiceId: string, fd: FormData) {
  await requireRole(['ADMIN', 'ACCOUNTING', 'SALES']);
  const { paymentMethod } = methodSchema.parse({ paymentMethod: fd.get('paymentMethod') });
  await db.invoice.update({ where: { id: invoiceId }, data: { paymentMethod } });
  revalidatePath(`/perdagangan/invoices/${invoiceId}`);
}

export async function recordPayment(invoiceId: string, fd: FormData) {
  await requireRole(['ADMIN', 'ACCOUNTING', 'SALES']);
  const data = paymentSchema.parse({
    amount: fd.get('amount'),
    method: fd.get('method') || 'TRANSFER',
    reference: fd.get('reference') || null,
    date: fd.get('date') || null,
    notes: fd.get('notes') || null,
  });

  await db.$transaction(async (tx) => {
    const inv = await tx.invoice.findUnique({ where: { id: invoiceId } });
    if (!inv) throw new Error('Invoice tidak ditemukan');
    await tx.payment.create({
      data: {
        invoiceId,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
        date: data.date ? new Date(data.date) : new Date(),
        notes: data.notes,
      },
    });
    const paid = inv.paid + data.amount;
    const status = paid >= inv.total ? 'PAID' : 'PARTIAL';
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { paid, status },
    });
    if (status === 'PAID') {
      await tx.salesOrder.update({ where: { id: inv.salesOrderId }, data: { status: 'PAID' } });
    }
  });

  revalidatePath(`/perdagangan/invoices/${invoiceId}`);
  revalidatePath('/perdagangan/invoices');
  revalidatePath('/keuangan/ar');
}

/**
 * Hapus invoice secara permanen. Khusus SUPER_ADMIN.
 * Otomatis menghapus seluruh pembayaran terkait (cascade) dan
 * mengembalikan status Sales Order ke CONFIRMED bila tidak ada
 * invoice lain pada SO tersebut.
 */
export async function deleteInvoice(invoiceId: string) {
  await requireSuperAdmin();

  const inv = await db.invoice.findUnique({ where: { id: invoiceId }, select: { salesOrderId: true } });
  if (!inv) throw new Error('Invoice tidak ditemukan');

  await db.$transaction(async (tx) => {
    await tx.payment.deleteMany({ where: { invoiceId } });
    await tx.invoice.delete({ where: { id: invoiceId } });

    const remaining = await tx.invoice.count({ where: { salesOrderId: inv.salesOrderId } });
    if (remaining === 0) {
      // Tidak ada invoice lain → kembalikan SO ke CONFIRMED supaya bisa di-invoice ulang.
      await tx.salesOrder.update({
        where: { id: inv.salesOrderId },
        data: { status: 'CONFIRMED' },
      });
    }
  });

  revalidatePath('/perdagangan/invoices');
  revalidatePath('/keuangan/ar');
  redirect('/perdagangan/invoices');
}
