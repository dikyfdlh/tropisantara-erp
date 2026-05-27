import { db } from '@/lib/db';

export type MonthlyCashflow = {
  monthKey: string;       // "2026-05"
  monthLabel: string;     // "Mei 2026"
  inflow: number;         // dari pembayaran invoice penjualan
  outflow: number;        // dari pembayaran ke supplier
  net: number;            // inflow - outflow
};

const MONTH_NAMES_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

function monthKeyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabelOf(d: Date): string {
  return `${MONTH_NAMES_ID[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Ringkas cashflow bulanan untuk `monthsBack` bulan terakhir (termasuk bulan ini).
 * Inflow = jumlah Payment (pembayaran invoice penjualan)
 * Outflow = jumlah SupplierPayment (pembayaran ke supplier)
 */
export async function getMonthlyCashflow(monthsBack = 6): Promise<MonthlyCashflow[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);
  start.setHours(0, 0, 0, 0);

  const [inflows, outflows] = await Promise.all([
    db.payment.findMany({
      where: { date: { gte: start } },
      select: { date: true, amount: true },
    }),
    db.supplierPayment.findMany({
      where: { date: { gte: start } },
      select: { date: true, amount: true },
    }),
  ]);

  // Build bucket peta key → totals
  const buckets = new Map<string, MonthlyCashflow>();
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - i), 1);
    const k = monthKeyOf(d);
    buckets.set(k, { monthKey: k, monthLabel: monthLabelOf(d), inflow: 0, outflow: 0, net: 0 });
  }

  for (const p of inflows) {
    const k = monthKeyOf(new Date(p.date));
    const b = buckets.get(k);
    if (b) b.inflow += p.amount;
  }
  for (const p of outflows) {
    const k = monthKeyOf(new Date(p.date));
    const b = buckets.get(k);
    if (b) b.outflow += p.amount;
  }
  for (const b of buckets.values()) b.net = b.inflow - b.outflow;

  return Array.from(buckets.values());
}

/** Ringkasan inflow/outflow/net total dari array bulanan. */
export function summarizeCashflow(rows: MonthlyCashflow[]) {
  const inflow  = rows.reduce((s, r) => s + r.inflow,  0);
  const outflow = rows.reduce((s, r) => s + r.outflow, 0);
  return { inflow, outflow, net: inflow - outflow };
}
