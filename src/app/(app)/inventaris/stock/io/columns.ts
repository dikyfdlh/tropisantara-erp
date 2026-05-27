// Kolom Stock untuk Import/Export.
// Catatan: productCode & warehouseCode adalah komposite key untuk upsert.
// Kolom yang merupakan turunan (productName, warehouseName, uomCode, minStock)
// hanya dipakai pada ekspor; saat impor mereka diabaikan.

export const STOCK_COLUMNS = [
  { key: 'productCode',   label: 'Kode Produk',       required: true,  importable: true,  hint: 'Product.code' },
  { key: 'productName',   label: 'Nama Produk',       required: false, importable: false, hint: 'hanya untuk ekspor' },
  { key: 'warehouseCode', label: 'Kode Gudang',       required: true,  importable: true,  hint: 'Warehouse.code' },
  { key: 'warehouseName', label: 'Nama Gudang',       required: false, importable: false, hint: 'hanya untuk ekspor' },
  { key: 'uomCode',       label: 'Satuan',            required: false, importable: false, hint: 'hanya untuk ekspor' },
  { key: 'qty',           label: 'Qty (saldo stok)',  required: false, importable: true,  hint: 'angka — saldo akhir' },
  { key: 'minStock',      label: 'Stok Min. Produk',  required: false, importable: false, hint: 'hanya untuk ekspor' },
] as const;

export type StockColumnKey = (typeof STOCK_COLUMNS)[number]['key'];
