// Halaman print menggunakan layout root sendiri (full <html><body>) untuk
// menghindari sidebar/topbar. Layout ini hanya pass-through.
export default function InvoicePrintLayout({ children }: { children: React.ReactNode }) {
  return children;
}
