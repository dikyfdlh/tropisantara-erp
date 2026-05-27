'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { csvToObjects } from '@/lib/csv';

export type StockImportResult = {
  ok: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string }[];
};

export async function importStock(fd: FormData): Promise<StockImportResult> {
  await requireRole(['ADMIN', 'WAREHOUSE']);

  const file = fd.get('file') as File | null;
  if (!file || file.size === 0) {
    return { ok: false, created: 0, updated: 0, skipped: 0, errors: [{ row: 0, message: 'File CSV tidak ditemukan' }] };
  }

  const allowed = new Set(fd.getAll('columns').map(String));
  // qty wajib ada untuk update saldo; productCode & warehouseCode adalah key.
  const keyCols = ['productCode', 'warehouseCode'];

  const text = await file.text();
  const objects = csvToObjects(text);
  if (objects.length === 0) {
    return { ok: false, created: 0, updated: 0, skipped: 0, errors: [{ row: 0, message: 'CSV kosong / tanpa data' }] };
  }

  // Pre-fetch products & warehouses
  const [products, warehouses] = await Promise.all([
    db.product.findMany({ select: { id: true, code: true } }),
    db.warehouse.findMany({ select: { id: true, code: true } }),
  ]);
  const prodByCode = new Map(products.map((p) => [p.code.toLowerCase(), p.id]));
  const whByCode   = new Map(warehouses.map((w) => [w.code.toLowerCase(), w.id]));

  let created = 0, updated = 0, skipped = 0;
  const errors: StockImportResult['errors'] = [];

  for (let i = 0; i < objects.length; i++) {
    const row = objects[i];
    const rowNo = i + 2;
    try {
      const productCode = (row.productCode ?? '').trim();
      const warehouseCode = (row.warehouseCode ?? '').trim();
      if (!productCode || !warehouseCode) {
        throw new Error('Kolom productCode dan warehouseCode wajib diisi');
      }
      const productId = prodByCode.get(productCode.toLowerCase());
      const warehouseId = whByCode.get(warehouseCode.toLowerCase());
      if (!productId) throw new Error(`Produk tidak ditemukan: ${productCode}`);
      if (!warehouseId) throw new Error(`Gudang tidak ditemukan: ${warehouseCode}`);

      // Hanya kolom qty yang dapat di-import (selain key cols)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: Record<string, any> = {};
      if (allowed.has('qty') && row.qty !== undefined && row.qty !== '') {
        const q = parseFloat(row.qty);
        if (Number.isNaN(q)) throw new Error(`qty bukan angka: ${row.qty}`);
        data.qty = q;
      }

      const existing = await db.stockLevel.findUnique({
        where: { productId_warehouseId: { productId, warehouseId } },
        select: { id: true },
      });

      if (existing) {
        if (Object.keys(data).length === 0) { skipped++; continue; }
        await db.stockLevel.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        // Buat baru — minimal butuh qty (default 0 bila tidak ada)
        await db.stockLevel.create({
          data: { productId, warehouseId, qty: data.qty ?? 0 },
        });
        created++;
      }
    } catch (e) {
      skipped++;
      errors.push({ row: rowNo, message: (e as Error).message });
    }
  }

  void keyCols; // referenced for documentation

  revalidatePath('/inventaris/stock');

  return { ok: errors.length === 0, created, updated, skipped, errors };
}
