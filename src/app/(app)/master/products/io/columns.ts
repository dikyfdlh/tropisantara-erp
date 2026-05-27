// Konfigurasi kolom Produk untuk Import / Export.
// Dipakai oleh UI (client) dan server action.

export const PRODUCT_COLUMNS = [
  { key: 'code',         label: 'Kode',        required: true,  importable: true },
  { key: 'name',         label: 'Nama',        required: true,  importable: true },
  { key: 'type',         label: 'Tipe',        required: false, importable: true, hint: 'RAW | FG | MERCHANDISE | SERVICE' },
  { key: 'categoryCode', label: 'Kategori',    required: false, importable: true, hint: 'kode kategori (Category.code)' },
  { key: 'uomCode',      label: 'Satuan',      required: false, importable: true, hint: 'kode UoM (Uom.code)' },
  { key: 'sellPrice',    label: 'Harga Jual',  required: false, importable: true },
  { key: 'buyPrice',     label: 'Harga Beli',  required: false, importable: true },
  { key: 'minStock',     label: 'Stok Min.',   required: false, importable: true },
  { key: 'isActive',     label: 'Aktif',       required: false, importable: true, hint: 'true / false' },
  { key: 'description',  label: 'Deskripsi',   required: false, importable: true },
] as const;

export type ProductColumnKey = (typeof PRODUCT_COLUMNS)[number]['key'];
