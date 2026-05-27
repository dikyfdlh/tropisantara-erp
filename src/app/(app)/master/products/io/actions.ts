'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { csvToObjects } from '@/lib/csv';
import { nextCode } from '@/lib/codegen';
import { PRODUCT_COLUMNS, type ProductColumnKey } from './columns';

export type ImportResult = {
  ok: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string }[];
  appliedColumns: string[];
};

const TYPES = new Set(['RAW', 'FG', 'MERCHANDISE', 'SERVICE']);

export async function importProducts(fd: FormData): Promise<ImportResult> {
  await requireRole(['ADMIN']);

  const file = fd.get('file') as File | null;
  if (!file || file.size === 0) {
    return { ok: false, created: 0, updated: 0, skipped: 0, errors: [{ row: 0, message: 'File CSV tidak ditemukan' }], appliedColumns: [] };
  }

  // Kolom-kolom yang diizinkan untuk dipakai (yang dicentang user).
  const allowedKeys = new Set(
    fd.getAll('columns').map(String).filter((k): k is ProductColumnKey =>
      (PRODUCT_COLUMNS as readonly { key: string }[]).some((c) => c.key === k),
    ),
  );
  // `code` selalu wajib agar bisa upsert.
  allowedKeys.add('code');

  const text = await file.text();
  const objects = csvToObjects(text);
  if (objects.length === 0) {
    return { ok: false, created: 0, updated: 0, skipped: 0, errors: [{ row: 0, message: 'CSV kosong / tanpa data' }], appliedColumns: [] };
  }

  // Pre-fetch lookup: category & uom by code
  const [cats, uoms] = await Promise.all([
    db.category.findMany({ select: { id: true, code: true } }),
    db.uom.findMany({ select: { id: true, code: true } }),
  ]);
  const catByCode = new Map(cats.map((c) => [c.code.toLowerCase(), c.id]));
  const uomByCode = new Map(uoms.map((u) => [u.code.toLowerCase(), u.id]));

  let created = 0, updated = 0, skipped = 0;
  const errors: ImportResult['errors'] = [];

  for (let i = 0; i < objects.length; i++) {
    const row = objects[i];
    const rowNo = i + 2; // baris 1 adalah header

    try {
      const codeRaw = (row.code ?? '').trim();
      if (!codeRaw) { skipped++; errors.push({ row: rowNo, message: 'Kolom "code" kosong' }); continue; }

      // Bangun data yang akan di-set
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: Record<string, any> = {};

      if (allowedKeys.has('name')        && row.name        !== undefined && row.name !== '') data.name = row.name;
      if (allowedKeys.has('type')        && row.type        !== undefined && row.type !== '') {
        const t = row.type.toUpperCase();
        if (!TYPES.has(t)) throw new Error(`Tipe tidak valid: ${row.type}`);
        data.type = t;
      }
      if (allowedKeys.has('categoryCode') && row.categoryCode !== undefined && row.categoryCode !== '') {
        const id = catByCode.get(row.categoryCode.toLowerCase());
        if (!id) throw new Error(`Kategori tidak ditemukan: ${row.categoryCode}`);
        data.categoryId = id;
      }
      if (allowedKeys.has('uomCode')     && row.uomCode     !== undefined && row.uomCode !== '') {
        const id = uomByCode.get(row.uomCode.toLowerCase());
        if (!id) throw new Error(`Satuan tidak ditemukan: ${row.uomCode}`);
        data.uomId = id;
      }
      if (allowedKeys.has('sellPrice')   && row.sellPrice   !== undefined && row.sellPrice !== '') data.sellPrice = parseInt(row.sellPrice, 10) || 0;
      if (allowedKeys.has('buyPrice')    && row.buyPrice    !== undefined && row.buyPrice  !== '') data.buyPrice  = parseInt(row.buyPrice,  10) || 0;
      if (allowedKeys.has('minStock')    && row.minStock    !== undefined && row.minStock  !== '') data.minStock  = parseInt(row.minStock,  10) || 0;
      if (allowedKeys.has('isActive')    && row.isActive    !== undefined && row.isActive  !== '') {
        data.isActive = /^(true|1|yes|y|aktif)$/i.test(row.isActive);
      }
      if (allowedKeys.has('description') && row.description !== undefined) data.description = row.description || null;

      const existing = await db.product.findUnique({ where: { code: codeRaw }, select: { id: true } });
      if (existing) {
        if (Object.keys(data).length === 0) { skipped++; continue; }
        await db.product.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        // Untuk create, butuh setidaknya name, type, categoryId, uomId
        if (!data.name || !data.type || !data.categoryId || !data.uomId) {
          throw new Error('Untuk produk baru, kolom name, type, categoryCode, uomCode wajib ada');
        }
        // Bila code dari CSV mengikuti pola sendiri kita pakai apa adanya; bila kosong, generate.
        const code = codeRaw || (await nextCode('PRD'));
        await db.product.create({ data: { code, ...data } });
        created++;
      }
    } catch (e) {
      skipped++;
      errors.push({ row: rowNo, message: (e as Error).message });
    }
  }

  revalidatePath('/master/products');
  revalidatePath('/inventaris/stock');

  return {
    ok: errors.length === 0,
    created, updated, skipped, errors,
    appliedColumns: [...allowedKeys],
  };
}
