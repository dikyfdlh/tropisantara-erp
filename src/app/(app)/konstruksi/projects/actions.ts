'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { nextCode } from '@/lib/codegen';

const STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] as const;

const schema = z.object({
  name: z.string().min(2),
  customerId: z.string().min(1),
  location: z.string().optional().nullable(),
  contractValue: z.coerce.number().int().min(0).default(0),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  description: z.string().optional().nullable(),
  status: z.enum(STATUSES).default('PLANNING'),
});

function parse(fd: FormData) {
  const d = schema.parse({
    name: fd.get('name'),
    customerId: fd.get('customerId'),
    location: fd.get('location') || null,
    contractValue: fd.get('contractValue') || 0,
    startDate: fd.get('startDate'),
    endDate: fd.get('endDate'),
    description: fd.get('description') || null,
    status: fd.get('status') || 'PLANNING',
  });
  return { ...d, startDate: new Date(d.startDate), endDate: new Date(d.endDate) };
}

export async function createProject(fd: FormData) {
  const user = await requireRole(['ADMIN', 'PROJECT_MANAGER']);
  const data = parse(fd);
  const code = await nextCode('PRJ');
  await db.project.create({ data: { code, ...data, createdById: user.id } });
  revalidatePath('/konstruksi/projects');
  redirect('/konstruksi/projects');
}

export async function updateProject(id: string, fd: FormData) {
  await requireRole(['ADMIN', 'PROJECT_MANAGER']);
  await db.project.update({ where: { id }, data: parse(fd) });
  revalidatePath('/konstruksi/projects');
  revalidatePath(`/konstruksi/projects/${id}`);
  redirect(`/konstruksi/projects/${id}`);
}

// ---------- RAB ----------

const rabSchema = z.object({
  workName: z.string().min(2),
  productId: z.string().optional().nullable(),
  uom: z.string().min(1),
  qty: z.coerce.number().positive(),
  unitPrice: z.coerce.number().int().min(0),
});

export async function addRab(projectId: string, fd: FormData) {
  await requireRole(['ADMIN', 'PROJECT_MANAGER']);
  const d = rabSchema.parse({
    workName: fd.get('workName'),
    productId: fd.get('productId') || null,
    uom: fd.get('uom'),
    qty: fd.get('qty'),
    unitPrice: fd.get('unitPrice'),
  });
  const last = await db.rabItem.findFirst({ where: { projectId }, orderBy: { no: 'desc' } });
  const total = Math.round(d.qty * d.unitPrice);
  await db.rabItem.create({
    data: {
      projectId,
      no: (last?.no ?? 0) + 1,
      workName: d.workName,
      productId: d.productId || null,
      uom: d.uom,
      qty: d.qty,
      unitPrice: d.unitPrice,
      total,
    },
  });
  revalidatePath(`/konstruksi/projects/${projectId}`);
}

export async function deleteRab(projectId: string, rabId: string) {
  await requireRole(['ADMIN', 'PROJECT_MANAGER']);
  await db.rabItem.delete({ where: { id: rabId } });
  revalidatePath(`/konstruksi/projects/${projectId}`);
}

// ---------- TERMIN ----------

const terminSchema = z.object({
  description: z.string().min(2),
  percentage: z.coerce.number().min(0).max(100),
  amount: z.coerce.number().int().min(0),
  dueDate: z.string().min(1),
});

export async function addTermin(projectId: string, fd: FormData) {
  await requireRole(['ADMIN', 'PROJECT_MANAGER']);
  const d = terminSchema.parse({
    description: fd.get('description'),
    percentage: fd.get('percentage'),
    amount: fd.get('amount'),
    dueDate: fd.get('dueDate'),
  });
  const last = await db.termin.findFirst({ where: { projectId }, orderBy: { termNo: 'desc' } });
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) return;
  const code = await nextCode('TRM');
  await db.termin.create({
    data: {
      code,
      projectId,
      termNo: (last?.termNo ?? 0) + 1,
      description: d.description,
      percentage: d.percentage,
      amount: d.amount,
      dueDate: new Date(d.dueDate),
    },
  });
  revalidatePath(`/konstruksi/projects/${projectId}`);
}

export async function markTerminPaid(projectId: string, terminId: string) {
  await requireRole(['ADMIN', 'PROJECT_MANAGER', 'ACCOUNTING']);
  await db.termin.update({ where: { id: terminId }, data: { status: 'PAID', paidAt: new Date() } });
  revalidatePath(`/konstruksi/projects/${projectId}`);
  revalidatePath('/konstruksi/termin');
}

// ---------- PROGRESS ----------

export async function addProgress(projectId: string, fd: FormData) {
  await requireRole(['ADMIN', 'PROJECT_MANAGER']);
  const percentage = z.coerce.number().min(0).max(100).parse(fd.get('percentage'));
  const notes = (fd.get('notes') as string) || null;
  const date = (fd.get('date') as string) || new Date().toISOString();
  await db.projectProgress.create({
    data: { projectId, percentage, notes, date: new Date(date) },
  });
  revalidatePath(`/konstruksi/projects/${projectId}`);
}
