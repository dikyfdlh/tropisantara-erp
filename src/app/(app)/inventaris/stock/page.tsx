import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/rbac';
import { getT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { ArrowDownUp } from 'lucide-react';

export default async function StockPage() {
  const user = await requireUser();
  const { t } = await getT();
  const canIO = ['ADMIN', 'WAREHOUSE', 'SUPER_ADMIN'].includes(user.role);
  const [products, warehouses] = await Promise.all([
    db.product.findMany({
      where: { isActive: true },
      include: { uom: true, category: true, stockLevels: { include: { warehouse: true } } },
      orderBy: { code: 'asc' },
    }),
    db.warehouse.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } }),
  ]);

  return (
    <div>
      <PageHeader title={t('page.stock.title')} description={t('page.stock.desc')}>
        {canIO && (
          <Link href="/inventaris/stock/io">
            <Button variant="outline"><ArrowDownUp className="h-4 w-4" /> {t('btn.importExport')}</Button>
          </Link>
        )}
      </PageHeader>
      {products.length === 0 ? <Empty>{t('empty.default')}</Empty> : (
        <Card>
          <CardBody className="!p-0">
            <Table>
              <THead>
                <TR>
                  <TH>{t('col.code')}</TH>
                  <TH>{t('col.name')}</TH>
                  <TH>{t('col.category')}</TH>
                  <TH>{t('col.uom')}</TH>
                  {warehouses.map((w) => <TH key={w.id} className="text-right">{w.code}</TH>)}
                  <TH className="text-right">{t('col.total')}</TH>
                  <TH>{t('col.status')}</TH>
                </TR>
              </THead>
              <TBody>
                {products.map((p) => {
                  const map = new Map(p.stockLevels.map((l) => [l.warehouseId, l.qty]));
                  const total = p.stockLevels.reduce((s, l) => s + l.qty, 0);
                  const lowStock = p.minStock > 0 && total < p.minStock;
                  return (
                    <TR key={p.id}>
                      <TD className="font-medium">{p.code}</TD>
                      <TD>{p.name}</TD>
                      <TD>{p.category.name}</TD>
                      <TD>{p.uom.code}</TD>
                      {warehouses.map((w) => (
                        <TD key={w.id} className="text-right">{map.get(w.id) ?? 0}</TD>
                      ))}
                      <TD className={`text-right font-semibold ${lowStock ? 'text-rose-600' : ''}`}>{total}</TD>
                      <TD>{lowStock ? <Badge tone="rose">{t('page.stock.belowMin')}</Badge> : <Badge tone="emerald">{t('page.stock.safe')}</Badge>}</TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
