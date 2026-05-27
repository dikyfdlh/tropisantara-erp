import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/rbac';
import { getCompanySettings } from '@/lib/settings';
import { formatRupiah, formatInvoiceNumber, paymentMethodLabel } from '@/lib/format';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { AutoPrint } from './auto-print';

export default async function InvoicePrintPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ auto?: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const { auto } = await searchParams;

  const [inv, settings] = await Promise.all([
    db.invoice.findUnique({
      where: { id },
      include: {
        salesOrder: {
          include: {
            customer: true,
            items: { include: { product: { include: { uom: true } } } },
          },
        },
        payments: { orderBy: { date: 'asc' } },
      },
    }),
    getCompanySettings(),
  ]);
  if (!inv) notFound();

  const so = inv.salesOrder;
  const cust = so.customer;
  const accent = settings.primaryColor || '#1f7a3a';

  const method =
    inv.payments.length > 0 ? inv.payments[inv.payments.length - 1].method : inv.paymentMethod;

  const addrLines = [
    cust.address,
    [cust.city, cust.province, cust.postalCode].filter(Boolean).join(', '),
  ].filter(Boolean);

  const printedNo = formatInvoiceNumber(inv.code);
  const dateStr = format(new Date(inv.date), 'd MMMM yyyy', { locale: idLocale });

  const primaryBank = settings.bankAccounts.find((b) => b.isPrimary) ?? settings.bankAccounts[0];

  return (
    <>
      <style>{`
        body { background: #f1f5f9 !important; }
        .inv-actions {
          max-width: 210mm; margin: 12px auto; padding: 8px 16px;
          display: flex; justify-content: flex-end; gap: 8px;
        }
        .inv-actions a, .inv-actions button {
          display: inline-block; padding: 8px 14px; font-size: 13px; font-weight: 600;
          border-radius: 6px; border: 1px solid #cbd5e1; background: #fff;
          color: #0f172a; text-decoration: none; cursor: pointer;
        }
        .inv-actions .primary { background: ${accent}; color: #fff; border-color: ${accent}; }

        .inv-page {
          width: 210mm; min-height: 297mm;
          margin: 0 auto 24px; padding: 18mm;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          font-family: 'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif;
          color: #1e293b;
          font-size: 13px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .inv-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
        .inv-brand { display: flex; align-items: center; gap: 12px; }
        .inv-brand-logo { width: 80px; height: 80px; display: grid; place-items: center; }
        .inv-brand-logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .inv-brand-name {
          font-size: 28px; font-weight: 700; letter-spacing: 4px;
          color: ${accent}; font-family: 'Times New Roman', serif;
        }
        .inv-title { text-align: right; }
        .inv-title .lbl { font-size: 22px; font-weight: 800; letter-spacing: 2px; color: #0f172a; }
        .inv-title .num { margin-top: 4px; font-size: 12px; font-weight: 600; color: ${accent}; }

        .inv-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 28px; }
        .inv-parties h4 { margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; color: #0f172a; }
        .inv-parties p { margin: 4px 0; line-height: 1.5; }
        .muted { color: #475569; }

        table.inv-items { width: 100%; border-collapse: collapse; margin-top: 28px; font-size: 13px; }
        table.inv-items th, table.inv-items td { border: 1px solid #94a3b8; padding: 10px 12px; vertical-align: top; }
        table.inv-items th { background: #f8fafc; text-align: left; font-weight: 700; }
        table.inv-items .totalrow td { border: none; padding: 10px 12px; font-weight: 700; }
        table.inv-items .totalrow td.label { text-align: right; }
        table.inv-items .totalrow td.amt   { text-align: right; }

        .inv-notes { margin-top: 28px; font-size: 12px; line-height: 1.7; color: #334155; }
        .inv-notes p { margin: 6px 0; }
        .inv-bank-list, .inv-wa-list { margin: 6px 0 6px 16px; padding: 0; }
        .inv-bank-list li, .inv-wa-list li { margin: 2px 0; }

        @media print {
          html, body { background: #fff !important; }
          .inv-actions { display: none; }
          .inv-page { margin: 0; box-shadow: none; padding: 14mm; width: 210mm; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      <AutoPrint enabled={auto === '1'} />

      <div className="inv-actions">
        <a href={`/perdagangan/invoices/${inv.id}`}>Kembali</a>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="primary" href="javascript:window.print()">Cetak / Simpan PDF</a>
      </div>

      <div className="inv-page">
        <div className="inv-header">
          <div className="inv-brand">
            <div className="inv-brand-logo">
              {settings.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={settings.logoUrl} alt="Logo" />
              ) : (
                <svg width="80" height="80" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                  <g fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M32 56 L34 30" />
                    <path d="M34 30 C 22 22, 14 22, 8 26" />
                    <path d="M34 30 C 24 18, 16 14, 10 14" />
                    <path d="M34 30 C 30 16, 28 10, 26 6" />
                    <path d="M34 30 C 40 18, 50 14, 58 14" />
                    <path d="M34 30 C 46 22, 54 22, 60 26" />
                  </g>
                  <ellipse cx="32" cy="58" rx="14" ry="3" fill={accent} fillOpacity="0.25" />
                </svg>
              )}
            </div>
            {(settings.brandName || settings.tagline) && (
              <div>
                {settings.brandName && <div className="inv-brand-name">{settings.brandName}</div>}
                {settings.tagline && (
                  <div style={{ fontSize: 11, color: '#64748b' }}>{settings.tagline}</div>
                )}
              </div>
            )}
          </div>
          <div className="inv-title">
            <div className="lbl">INVOICE</div>
            <div className="num">{printedNo}</div>
          </div>
        </div>

        <div className="inv-parties">
          <div>
            <h4>DITERBITKAN ATAS NAMA</h4>
            <p><span className="muted">Penjual :</span> <b>{settings.companyName}</b></p>
            {settings.address && <p style={{ fontSize: 12 }} className="muted">{settings.address}</p>}
            {(settings.city || settings.province) && (
              <p style={{ fontSize: 12 }} className="muted">
                {[settings.city, settings.province, settings.postalCode].filter(Boolean).join(', ')}
              </p>
            )}
            {settings.npwp && <p style={{ fontSize: 12 }} className="muted">NPWP: {settings.npwp}</p>}
          </div>
          <div>
            <h4>UNTUK</h4>
            <p><span className="muted">Jenis Badan Usaha :</span> <b>{cust.businessType}</b></p>
            <p><span className="muted">Nama Penerima :</span> {cust.name}</p>
            <p><span className="muted">Tanggal Pembelian :</span> <b>{dateStr}</b></p>
            <p style={{ marginTop: 8 }}><span className="muted">Alamat Pengiriman :</span></p>
            <p><b>{cust.name}</b></p>
            {addrLines.map((l, i) => <p key={i}>{l}</p>)}
          </div>
        </div>

        <table className="inv-items">
          <thead>
            <tr>
              <th style={{ width: '46%' }}>Info Produk</th>
              <th style={{ width: '27%' }}>Harga Satuan</th>
              <th style={{ width: '27%' }}>Total Harga</th>
            </tr>
          </thead>
          <tbody>
            {so.items.map((it) => (
              <tr key={it.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{it.product.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    {it.product.code} · {it.qty} {it.product.uom.code}
                    {it.discount > 0 && ` · Diskon ${formatRupiah(it.discount)}`}
                  </div>
                </td>
                <td>{formatRupiah(it.unitPrice)}</td>
                <td>{formatRupiah(it.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {so.tax > 0 && (
              <>
                <tr className="totalrow">
                  <td></td>
                  <td className="label muted" style={{ fontWeight: 500 }}>Subtotal</td>
                  <td className="amt" style={{ fontWeight: 500 }}>{formatRupiah(so.subtotal)}</td>
                </tr>
                <tr className="totalrow">
                  <td></td>
                  <td className="label muted" style={{ fontWeight: 500 }}>PPN ({so.taxRate}%)</td>
                  <td className="amt" style={{ fontWeight: 500 }}>{formatRupiah(so.tax)}</td>
                </tr>
              </>
            )}
            <tr className="totalrow">
              <td></td>
              <td className="label" style={{ fontSize: 14 }}>TOTAL BIAYA</td>
              <td className="amt" style={{ fontSize: 14 }}>{formatRupiah(inv.total)}</td>
            </tr>
            {inv.paid > 0 && inv.paid < inv.total && (
              <>
                <tr className="totalrow">
                  <td></td>
                  <td className="label muted">Dibayar</td>
                  <td className="amt muted">{formatRupiah(inv.paid)}</td>
                </tr>
                <tr className="totalrow">
                  <td></td>
                  <td className="label" style={{ color: '#b91c1c' }}>Sisa Tagihan</td>
                  <td className="amt" style={{ color: '#b91c1c' }}>{formatRupiah(inv.total - inv.paid)}</td>
                </tr>
              </>
            )}
          </tfoot>
        </table>

        <div className="inv-notes">
          <p><b>*Keterangan:</b></p>
          <p>Metode Pembayaran: <b>{paymentMethodLabel(method)}</b></p>
          {method === 'COD' && (
            <p>Biaya diatas sudah termasuk dengan biaya pengiriman, bongkar, dan muat.</p>
          )}
          {(method === 'TRANSFER' || method === 'GIRO') && primaryBank && (
            <>
              <p>Mohon transfer ke rekening berikut:</p>
              <ul className="inv-bank-list">
                {settings.bankAccounts.map((b) => (
                  <li key={b.id}>
                    <b>{b.bankName}</b> a.n. {b.accountName} — <b>{b.accountNumber}</b>
                    {b.isPrimary && settings.bankAccounts.length > 1 && (
                      <span style={{ color: accent, marginLeft: 6, fontSize: 11 }}>(utama)</span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
          {inv.notes && <p>{inv.notes}</p>}

          {settings.invoiceFooter && (
            <div style={{ marginTop: 12 }}>
              {settings.invoiceFooter.split('\n').map((line, i) => <p key={i}>{line}</p>)}
            </div>
          )}

          {settings.whatsappContacts.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p><b>Whatsapp Customer Service:</b></p>
              <ul className="inv-wa-list">
                {settings.whatsappContacts.map((w) => (
                  <li key={w.id}>{w.label}: <b>{w.number}</b></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
