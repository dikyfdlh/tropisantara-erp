import { db } from '@/lib/db';

/**
 * Auto-generate kode dokumen unik.
 * Pola:
 *  - CUST-0001, SUP-0001, PRD-00001, EMP-0001, WH-001
 *  - SO-YYYY-0001, PO-YYYY-0001, PRJ-YYYY-001, PRO-YYYY-0001, BOM-0001
 *  - DO-YYYY-MM-0001, GRN-YYYY-MM-0001, INV-YYYY-MM-0001
 */
export async function nextCode(kind: string): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');

  switch (kind) {
    case 'CUST': return await pad('Customer', 'CUST-', 4);
    case 'SUP':  return await pad('Supplier', 'SUP-', 4);
    case 'PRD':  return await pad('Product', 'PRD-', 5);
    case 'EMP':  return await pad('Employee', 'EMP-', 4);
    case 'WH':   return await pad('Warehouse', 'WH-', 3);
    case 'BOM':  return await pad('Bom', 'BOM-', 4);
    case 'SO':   return await padYearly('SalesOrder', `SO-${year}-`, 4);
    case 'PO':   return await padYearly('PurchaseOrder', `PO-${year}-`, 4);
    case 'PRJ':  return await padYearly('Project', `PRJ-${year}-`, 3);
    case 'PRO':  return await padYearly('ProductionOrder', `PRO-${year}-`, 4);
    case 'DO':   return await padMonthly('DeliveryOrder', `DO-${year}-${month}-`, 4);
    case 'GRN':  return await padMonthly('GoodsReceipt', `GRN-${year}-${month}-`, 4);
    case 'INV':  return await padMonthly('Invoice', `INV-${year}-${month}-`, 4);
    case 'MI':   return await padMonthly('MaterialIssue', `MI-${year}-${month}-`, 4);
    case 'PR':   return await padMonthly('ProductionReceipt', `PR-${year}-${month}-`, 4);
    case 'TRM':  return await padMonthly('Termin', `TRM-${year}-${month}-`, 4);
    case 'ADJ':  return await padMonthly('StockAdjustment', `ADJ-${year}-${month}-`, 4);
    default:
      throw new Error(`Unknown code kind: ${kind}`);
  }
}

async function pad(modelName: string, prefix: string, width: number) {
  const last = await findLast(modelName, prefix);
  const next = parseTail(last, prefix) + 1;
  return prefix + String(next).padStart(width, '0');
}

async function padYearly(modelName: string, prefix: string, width: number) {
  const last = await findLast(modelName, prefix);
  const next = parseTail(last, prefix) + 1;
  return prefix + String(next).padStart(width, '0');
}

async function padMonthly(modelName: string, prefix: string, width: number) {
  const last = await findLast(modelName, prefix);
  const next = parseTail(last, prefix) + 1;
  return prefix + String(next).padStart(width, '0');
}

function parseTail(code: string | null, prefix: string): number {
  if (!code) return 0;
  const n = parseInt(code.slice(prefix.length), 10);
  return Number.isNaN(n) ? 0 : n;
}

async function findLast(modelName: string, prefix: string): Promise<string | null> {
  // Akses dinamis via any agar tidak menambah switch panjang.
  // Setiap model memiliki kolom `code` unik.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = (db as any)[lc(modelName)];
  if (!model) throw new Error(`Model not found: ${modelName}`);
  const last = await model.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
    select: { code: true },
  });
  return last?.code ?? null;
}

function lc(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
