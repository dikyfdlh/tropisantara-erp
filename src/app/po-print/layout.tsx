// Pass-through (sama seperti invoice-print). Halaman PO menggunakan root layout
// global agar tidak mendapatkan sidebar (/(app)/layout.tsx tidak berlaku di sini).
export default function PoPrintLayout({ children }: { children: React.ReactNode }) {
  return children;
}
