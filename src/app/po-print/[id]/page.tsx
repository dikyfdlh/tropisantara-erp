import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/rbac';
import { getCompanySettings } from '@/lib/settings';
import { formatRupiah, formatPoNumber } from '@/lib/format';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { AutoPrint } from './auto-print';

/**
 * Cetak Purchase Order sebagai "Surat Permintaan Pembelian".
 * Tone-nya REQUEST (permintaan ke supplier), bukan billing seperti invoice.
 */
export default async function PoPrintPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ auto?: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const { auto } = await searchParams;

  const [po, settings] = await Promise.all([
    db.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { product: { include: { uom: true } } } },
      },
    }),
    getCompanySettings(),
  ]);
  if (!po) notFound();

  const sup = po.supplier;
  const accent = settings.primaryColor || '#1f7a3a';
  const printedNo = formatPoNumber(po.code, po.orderDate);
  const orderDateStr = format(new Date(po.orderDate), 'd MMMM yyyy', { locale: idLocale });
  const expectedStr  = po.expectedDate
    ? format(new Date(po.expectedDate), 'd MMMM yyyy', { locale: idLocale })
    : null;

  const supplierAddrLines = [
    sup.address,
    [sup.city, sup.province, sup.postalCode].filter(Boolean).join(', '),
  ].filter(Boolean);

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

        .po-page {
          width: 210mm; min-height: 297mm;
          margin: 0 auto 24px; padding: 18mm;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          font-family: 'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif;
          color: #1e293b;
          font-size: 13px;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
        .po-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
        .po-brand { display: flex; align-items: center; gap: 12px; }
        .po-brand-logo { width: 80px; height: 80px; display: grid; place-items: center; }
        .po-brand-logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .po-brand-name {
          font-size: 28px; font-weight: 700; letter-spacing: 4px;
          color: ${accent}; font-family: 'Times New Roman', serif;
        }
        .po-title { text-align: right; }
        .po-title .lbl {
          font-size: 22px; font-weight: 800; letter-spacing: 2px; color: #0f172a;
        }
        .po-title .sub { margin-top: 2px; font-size: 10px; font-weight: 600; color: #475569; letter-spacing: 2px; }
        .po-title .num { margin-top: 4px; font-size: 12px; font-weight: 600; color: ${accent}; }

        .po-intro {
          margin-top: 24px; padding: 12px 14px;
          background: linear-gradient(90deg, ${accent}14, transparent);
          border-left: 3px solid ${accent};
          border-radius: 4px;
          font-size: 12px; line-height: 1.6; color: #334155;
        }

        .po-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px; }
        .po-parties h4 { margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; color: #0f172a; }
        .po-parties p { margin: 4px 0; line-height: 1.5; }
        .muted { color: #475569; }

        table.po-items { width: 100%; border-collapse: collapse; margin-top: 22px; font-size: 13px; }
        table.po-items th, table.po-items td { border: 1px solid #94a3b8; padding: 10px 12px; vertical-align: top; }
        table.po-items th { background: #f8fafc; text-align: left; font-weight: 700; }
        table.po-items .num { text-align: right; }
        table.po-items .totalrow td { border: none; padding: 10px 12px; font-weight: 700; }
        table.po-items .totalrow td.label { text-align: right; }
        table.po-items .totalrow td.amt   { text-align: right; }

        .po-meta { margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; font-size: 12px; }
        .po-meta .box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; background: #f8fafc; }
        .po-meta .box .label { font-size: 10px; letter-spacing: 1px; font-weight: 700; color: #64748b; text-transform: uppercase; }
        .po-meta .box .val { margin-top: 2px; font-weight: 600; color: #0f172a; }

        .po-notes { margin-top: 24px; font-size: 12px; line-height: 1.7; color: #334155; }
        .po-notes p { margin: 6px 0; }
        .po-notes .heading { font-weight: 700; color: #0f172a; }

        .po-sign { margin-top: 36px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; font-size: 12px; }
        .po-sign .col { text-align: center; }
        .po-sign .col .role { font-weight: 600; color: #0f172a; }
        .po-sign .col .name { margin-top: 56px; border-top: 1px solid #94a3b8; padding-top: 4px; font-size: 11px; color: #475569; }

        @media print {
          html, body { background: #fff !important; }
          .inv-actions { display: none; }
          .po-page { margin: 0; box-shadow: none; padding: 14mm; width: 210mm; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      <AutoPrint enabled={auto === '1'} />

      <div className="inv-actions">
        <a href={`/perdagangan/purchase-orders/${po.id}`}>Kembali</a>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="primary" href="javascript:window.print()">Cetak / Simpan PDF</a>
      </div>

      <div className="po-page">
        {/* Header */}
        <div className="po-header">
          <div className="po-brand">
            <div className="po-brand-logo">
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
                {settings.brandName && <div className="po-brand-name">{settings.brandName}</div>}
                {settings.tagline && (
                  <div style={{ fontSize: 11, color: '#64748b' }}>{settings.tagline}</div>
                )}
              </div>
            )}
          </div>
          <div className="po-title">
            <div className="lbl">PURCHASE ORDER</div>
            <div className="sub">SURAT PERMINTAAN PEMBELIAN</div>
            <div className="num">{printedNo}</div>
          </div>
        </div>

        {/* Intro permintaan */}
        <div className="po-intro">
          <p style={{ margin: 0 }}>
            Dengan hormat,
          </p>
          <p style={{ margin: '6px 0 0' }}>
            Sehubungan dengan kebutuhan operasional perusahaan kami, dengan ini kami sampaikan{' '}
            <strong>permintaan pembelian</strong> atas barang yang dirinci pada dokumen ini. Mohon
            kesediaan Bapak/Ibu untuk dapat memenuhi permintaan sesuai dengan spesifikasi, jumlah,
            dan jadwal pengiriman yang tercantum. Terima kasih atas kerjasamanya.
          </p>
        </div>

        {/* Parties */}
        <div className="po-parties">
          <div>
            <h4>DITERBITKAN OLEH (PEMBELI)</h4>
            <p><strong>{settings.companyName}</strong></p>
            {settings.address && <p style={{ fontSize: 12 }} className="muted">{settings.address}</p>}
            {(settings.city || settings.province) && (
              <p style={{ fontSize: 12 }} className="muted">
                {[settings.city, settings.province, settings.postalCode].filter(Boolean).join(', ')}
              </p>
            )}
            {settings.phone && <p style={{ fontSize: 12 }} className="muted">Telp: {settings.phone}</p>}
            {settings.email && <p style={{ fontSize: 12 }} className="muted">Email: {settings.email}</p>}
            {settings.npwp  && <p style={{ fontSize: 12 }} className="muted">NPWP: {settings.npwp}</p>}
          </div>
          <div>
            <h4>DITUJUKAN KEPADA (PEMASOK)</h4>
            <p><span className="muted">Jenis Badan Usaha :</span> <strong>{sup.businessType}</strong></p>
            <p><strong>{sup.name}</strong></p>
            {supplierAddrLines.map((l, i) => <p key={i} className="muted">{l}</p>)}
            {sup.phone    && <p style={{ fontSize: 12 }} className="muted">Telp: {sup.phone}</p>}
            {sup.whatsapp && <p style={{ fontSize: 12 }} className="muted">WhatsApp: {sup.whatsapp}</p>}
            {sup.email    && <p style={{ fontSize: 12 }} className="muted">Email: {sup.email}</p>}
            {sup.npwp     && <p style={{ fontSize: 12 }} className="muted">NPWP: {sup.npwp}</p>}
          </div>
        </div>

        {/* Meta: tanggal */}
        <div className="po-meta">
          <div className="box">
            <div className="label">Tanggal Diterbitkan</div>
            <div className="val">{orderDateStr}</div>
          </div>
          <div className="box">
            <div className="label">Jadwal Diharapkan Tiba</div>
            <div className="val">{expectedStr ?? <span className="muted">— belum ditentukan —</span>}</div>
          </div>
        </div>

        {/* Items */}
        <table className="po-items">
          <thead>
            <tr>
              <th style={{ width: '6%' }}>No</th>
              <th style={{ width: '44%' }}>Info Produk</th>
              <th style={{ width: '12%' }} className="num">Qty</th>
              <th style={{ width: '18%' }} className="num">Harga Satuan</th>
              <th style={{ width: '20%' }} className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((it, idx) => (
              <tr key={it.id}>
                <td>{idx + 1}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{it.product.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{it.product.code}</div>
                </td>
                <td className="num">{it.qty} {it.product.uom.code}</td>
                <td className="num">{formatRupiah(it.unitPrice)}</td>
                <td className="num">{formatRupiah(it.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {po.tax > 0 && (
              <>
                <tr className="totalrow">
                  <td colSpan={3}></td>
                  <td className="label muted" style={{ fontWeight: 500 }}>Subtotal</td>
                  <td className="amt" style={{ fontWeight: 500 }}>{formatRupiah(po.subtotal)}</td>
                </tr>
                <tr className="totalrow">
                  <td colSpan={3}></td>
                  <td className="label muted" style={{ fontWeight: 500 }}>PPN ({po.taxRate}%)</td>
                  <td className="amt" style={{ fontWeight: 500 }}>{formatRupiah(po.tax)}</td>
                </tr>
              </>
            )}
            <tr className="totalrow">
              <td colSpan={3}></td>
              <td className="label" style={{ fontSize: 14 }}>NILAI PERMINTAAN</td>
              <td className="amt" style={{ fontSize: 14 }}>{formatRupiah(po.total)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Notes */}
        <div className="po-notes">
          <p className="heading">*Ketentuan & Catatan:</p>
          <p>1. Mohon konfirmasi penerimaan PO ini kepada bagian Pembelian kami sebelum melakukan pengiriman.</p>
          <p>2. Pembayaran akan dilakukan dalam <strong>{sup.paymentTerm} hari</strong> sejak barang diterima dengan baik dan invoice resmi diserahkan.</p>
          {primaryBank && (
            <p>3. Pembayaran ditransfer ke rekening <strong>{settings.companyName}</strong>. Detail rekening akan dikoordinasikan oleh tim Keuangan kami.</p>
          )}
          <p>4. Barang yang dikirim harus sesuai spesifikasi, jumlah, dan kualitas pada PO. Kami berhak menolak/retur bila tidak sesuai.</p>
          <p>5. Bukti penerimaan (Goods Receipt) akan diterbitkan oleh tim Gudang kami saat barang diterima.</p>
          {po.notes && (
            <>
              <p className="heading" style={{ marginTop: 12 }}>Catatan Khusus:</p>
              <p>{po.notes}</p>
            </>
          )}

          {settings.whatsappContacts.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p className="heading">Kontak Pembelian / Konfirmasi:</p>
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                {settings.whatsappContacts.map((w) => (
                  <li key={w.id}>{w.label}: <strong>{w.number}</strong></li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Tanda tangan */}
        <div className="po-sign">
          <div className="col">
            <div className="role">Hormat kami,</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>Bagian Pembelian — {settings.companyName}</div>
            <div className="name">( ........................ )</div>
          </div>
          <div className="col">
            <div className="role">Diterima &amp; Disetujui</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{sup.name}</div>
            <div className="name">( ........................ )</div>
          </div>
        </div>
      </div>
    </>
  );
}
