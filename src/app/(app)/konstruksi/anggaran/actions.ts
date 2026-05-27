'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { nextCode } from '@/lib/codegen';

const lineSchema = z.object({
  templateId: z.string().min(1),
  qty: z.coerce.number().positive(),
});

const saveSchema = z.object({
  customerId: z.string().min(1),
  name: z.string().min(2),
  location: z.string().optional().nullable(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  overheadPct: z.coerce.number().min(0).max(100).default(10),
  contingencyPct: z.coerce.number().min(0).max(100).default(5),
  ppnPct: z.coerce.number().min(0).max(100).default(0),
  lines: z.array(lineSchema).min(1),
});

/**
 * Simpan hasil kalkulator anggaran sebagai Project baru beserta RAB-nya.
 */
export async function saveBudgetAsProject(payload: unknown) {
  const user = await requireRole(['ADMIN', 'PROJECT_MANAGER']);
  const data = saveSchema.parse(payload);

  const templates = await db.workItemTemplate.findMany({
    where: { id: { in: data.lines.map((l) => l.templateId) } },
  });
  const tplById = new Map(templates.map((t) => [t.id, t]));

  // Hitung subtotal per baris (material + labor + equipment) × qty
  const itemsRaw = data.lines.map((l) => {
    const t = tplById.get(l.templateId);
    if (!t) throw new Error('Template tidak ditemukan');
    const unitPrice = t.materialCost + t.laborCost + t.equipmentCost;
    const total = Math.round(unitPrice * l.qty);
    return { template: t, qty: l.qty, unitPrice, total };
  });

  const direct = itemsRaw.reduce((s, r) => s + r.total, 0);
  const overhead = Math.round((direct * data.overheadPct) / 100);
  const contingency = Math.round((direct * data.contingencyPct) / 100);
  const beforeTax = direct + overhead + contingency;
  const ppn = Math.round((beforeTax * data.ppnPct) / 100);
  const grandTotal = beforeTax + ppn;

  const code = await nextCode('PRJ');

  const project = await db.project.create({
    data: {
      code,
      name: data.name,
      customerId: data.customerId,
      location: data.location || null,
      contractValue: grandTotal,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: 'PLANNING',
      description: `Anggaran dibuat dari kalkulator. Subtotal pekerjaan: Rp ${direct.toLocaleString('id-ID')}, Overhead ${data.overheadPct}%, Kontingensi ${data.contingencyPct}%, PPN ${data.ppnPct}%.`,
      createdById: user.id,
    },
  });

  // RAB items — satu baris per template
  let no = 1;
  for (const it of itemsRaw) {
    await db.rabItem.create({
      data: {
        projectId: project.id,
        no: no++,
        workName: `${it.template.code} — ${it.template.name}`,
        uom: it.template.unit,
        qty: it.qty,
        unitPrice: it.unitPrice,
        total: it.total,
      },
    });
  }
  // Baris overhead / kontingensi / PPN sebagai item RAB virtual
  if (overhead > 0) {
    await db.rabItem.create({
      data: {
        projectId: project.id, no: no++,
        workName: `Overhead & Profit (${data.overheadPct}%)`,
        uom: 'ls', qty: 1, unitPrice: overhead, total: overhead,
      },
    });
  }
  if (contingency > 0) {
    await db.rabItem.create({
      data: {
        projectId: project.id, no: no++,
        workName: `Kontingensi / Risk Reserve (${data.contingencyPct}%)`,
        uom: 'ls', qty: 1, unitPrice: contingency, total: contingency,
      },
    });
  }
  if (ppn > 0) {
    await db.rabItem.create({
      data: {
        projectId: project.id, no: no++,
        workName: `PPN (${data.ppnPct}%)`,
        uom: 'ls', qty: 1, unitPrice: ppn, total: ppn,
      },
    });
  }

  revalidatePath('/konstruksi/projects');
  redirect(`/konstruksi/projects/${project.id}`);
}
