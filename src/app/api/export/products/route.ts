import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/rbac';
import { toCsv } from '@/lib/csv';

// Daftar kolom yang dapat diekspor untuk Produk.
const PRODUCT_COLUMNS = [
  'code', 'name', 'type', 'categoryCode', 'uomCode',
  'sellPrice', 'buyPrice', 'minStock', 'isActive', 'description',
] as const;
type ProductColumn = (typeof PRODUCT_COLUMNS)[number];

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const url = new URL(req.url);
  const requested = url.searchParams.getAll('columns');
  const cols = (requested.length
    ? requested.filter((c): c is ProductColumn => (PRODUCT_COLUMNS as readonly string[]).includes(c))
    : [...PRODUCT_COLUMNS]) as ProductColumn[];

  if (cols.length === 0) return new NextResponse('No columns selected', { status: 400 });

  const products = await db.product.findMany({
    orderBy: { code: 'asc' },
    include: { category: true, uom: true },
  });

  const rows: (string | number | boolean | null)[][] = [
    cols, // header
    ...products.map((p) =>
      cols.map((c) => {
        switch (c) {
          case 'code':         return p.code;
          case 'name':         return p.name;
          case 'type':         return p.type;
          case 'categoryCode': return p.category.code;
          case 'uomCode':      return p.uom.code;
          case 'sellPrice':    return p.sellPrice;
          case 'buyPrice':     return p.buyPrice;
          case 'minStock':     return p.minStock;
          case 'isActive':     return p.isActive ? 'true' : 'false';
          case 'description':  return p.description ?? '';
        }
      }),
    ),
  ];

  const csv = '﻿' + toCsv(rows); // BOM agar Excel mengenali UTF-8
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="produk-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}

// Re-export daftar kolom & label agar dapat dipakai client component tanpa hardcode.
