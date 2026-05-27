import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/rbac';
import { getT, type Locale } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { Plus, Pencil, ArrowDownUp } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import { deleteProduct } from './actions';

const TYPE_LABEL: Record<Locale, Record<string, string>> = {
  id: { RAW: 'Bahan Baku',    FG: 'Barang Jadi',    MERCHANDISE: 'Dagangan',    SERVICE: 'Jasa' },
  en: { RAW: 'Raw Material',  FG: 'Finished Good',  MERCHANDISE: 'Merchandise', SERVICE: 'Service' },
};

export default async function ProductsPage() {
  const user = await requireUser();
  const { locale, t } = await getT();
  const canWrite = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const list = await db.product.findMany({
    orderBy: { code: 'asc' },
    include: { category: true, uom: true, stockLevels: true },
  });

  return (
    <div>
      <PageHeader title={t('page.products.title')} description={t('page.products.desc')}>
        {canWrite && (
          <>
            <Link href="/master/products/io">
              <Button variant="outline"><ArrowDownUp className="h-4 w-4" /> {t('btn.importExport')}</Button>
            </Link>
            <Link href="/master/products/new"><Button><Plus className="h-4 w-4" />{t('btn.add')}</Button></Link>
          </>
        )}
      </PageHeader>

      {list.length === 0 ? <Empty>{t('empty.default')}</Empty> : (
        <Table>
          <THead><TR>
            <TH>{t('col.code')}</TH>
            <TH>{t('col.name')}</TH>
            <TH>{t('col.type')}</TH>
            <TH>{t('col.category')}</TH>
            <TH>{t('col.uom')}</TH>
            <TH className="text-right">{t('col.sellPrice')}</TH>
            <TH className="text-right">{t('col.stock')}</TH>
            <TH>{t('col.status')}</TH>
            <TH></TH>
          </TR></THead>
          <TBody>
            {list.map((p) => {
              const stock = p.stockLevels.reduce((s, l) => s + l.qty, 0);
              const lowStock = p.minStock > 0 && stock < p.minStock;
              return (
                <TR key={p.id}>
                  <TD className="font-medium">{p.code}</TD>
                  <TD>{p.name}</TD>
                  <TD><Badge tone="brand">{TYPE_LABEL[locale][p.type] ?? p.type}</Badge></TD>
                  <TD>{p.category.name}</TD>
                  <TD>{p.uom.code}</TD>
                  <TD className="text-right">{formatRupiah(p.sellPrice)}</TD>
                  <TD className={`text-right ${lowStock ? 'text-rose-600 font-semibold' : ''}`}>{stock}</TD>
                  <TD>{p.isActive ? <Badge tone="emerald">{t('status.active')}</Badge> : <Badge>{t('status.inactive')}</Badge>}</TD>
                  <TD className="text-right">
                    {canWrite && (
                      <div className="flex justify-end gap-2">
                        <Link href={`/master/products/${p.id}`}>
                          <Button size="sm" variant="outline"><Pencil className="h-3.5 w-3.5" />{t('btn.edit')}</Button>
                        </Link>
                        {p.isActive && (
                          <form action={deleteProduct.bind(null, p.id)}>
                            <Button size="sm" variant="danger" type="submit">{t('btn.deactivate')}</Button>
                          </form>
                        )}
                      </div>
                    )}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </div>
  );
}
