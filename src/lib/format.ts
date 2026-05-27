import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export function formatRupiah(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return 'Rp ' + n.toLocaleString('id-ID', { maximumFractionDigits: 0 });
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  const n = Number(value ?? 0);
  return n.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatTanggal(d: Date | string | null | undefined, withTime = false): string {
  if (!d) return '-';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt.getTime())) return '-';
  return format(dt, withTime ? 'dd MMM yyyy HH:mm' : 'dd MMM yyyy', { locale: idLocale });
}

export function toInputDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt.getTime())) return '';
  return format(dt, 'yyyy-MM-dd');
}

/**
 * Konversi kode invoice internal `INV-YYYY-MM-NNNN` ke format cetak
 * `NNNN/INV/MM/YYYY` (mengikuti template Tropisantara).
 */
export function formatInvoiceNumber(code: string): string {
  const m = code.match(/^INV-(\d{4})-(\d{2})-(\d+)$/);
  if (!m) return code;
  return `${m[3]}/INV/${m[2]}/${m[1]}`;
}

/**
 * Konversi kode PO internal `PO-YYYY-NNNN` ke format cetak `NNNN/PO/MM/YYYY`.
 * Bulan diambil dari tanggal order (untuk menjaga konsistensi visual dengan invoice).
 */
export function formatPoNumber(code: string, orderDate: Date | string): string {
  const m = code.match(/^PO-(\d{4})-(\d+)$/);
  if (!m) return code;
  const d = typeof orderDate === 'string' ? new Date(orderDate) : orderDate;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${m[2]}/PO/${month}/${m[1]}`;
}

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Cash',
  TRANSFER: 'Transfer Bank',
  GIRO: 'Giro',
  COD: 'COD (Cash On Delivery)',
};
export function paymentMethodLabel(m: string): string {
  return METHOD_LABEL[m] ?? m;
}
