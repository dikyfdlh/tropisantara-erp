import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/rbac';
import { toCsv } from '@/lib/csv';

const STOCK_COLUMNS = [
  'productCode', 'productName', 'warehouseCode', 'warehouseName', 'uomCode', 'qty', 'minStock',
] as const;
type StockCol = (typeof STOCK_COLUMNS)[number];

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const url = new URL(req.url);
  const requested = url.searchParams.getAll('columns');
  const cols = (requested.length
    ? requested.filter((c): c is StockCol => (STOCK_COLUMNS as readonly string[]).includes(c))
    : [...STOCK_COLUMNS]) as StockCol[];

  if (cols.length === 0) return new NextResponse('No columns selected', { status: 400 });

  const levels = await db.stockLevel.findMany({
    include: { product: { include: { uom: true } }, warehouse: true },
    orderBy: [{ product: { code: 'asc' } }, { warehouse: { code: 'asc' } }],
  });

  const rows: (string | number | null)[][] = [
    cols,
    ...levels.map((l) =>
      cols.map((c) => {
        switch (c) {
          case 'productCode':   return l.product.code;
          case 'productName':   return l.product.name;
          case 'warehouseCode': return l.warehouse.code;
          case 'warehouseName': return l.warehouse.name;
          case 'uomCode':       return l.product.uom.code;
          case 'qty':           return l.qty;
          case 'minStock':      return l.product.minStock;
        }
      }),
    ),
  ];

  const csv = '﻿' + toCsv(rows);
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="stok-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
