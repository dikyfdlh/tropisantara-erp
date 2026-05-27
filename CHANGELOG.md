# Changelog

## [1.0.0] — 2026-05-27

Rilis awal sistem manajemen enterprise PT Provisio Permata Tropisantara.

### Fitur utama
- **Autentikasi & RBAC** — 9 role (Super Admin, Admin, Manager, Sales, Purchasing, Production, Project Manager, Warehouse, Accounting)
- **Master Data** — Pelanggan, Pemasok, Produk, Karyawan, Gudang, Kategori, UoM
- **Manufaktur** — BOM, Production Order dengan kebutuhan bahan otomatis
- **Konstruksi** — Proyek, RAB, Termin, Progress, Kalkulator Anggaran (AHSP/SNI)
- **Perdagangan** — Sales Order, Purchase Order, Invoice dengan template Tropisantara
- **Inventaris** — Stok per gudang, import/export CSV
- **Keuangan** — Piutang (AR), Hutang (AP), Cashflow dengan chart 6 bulan
- **Super Admin Area** — kelola semua user (dengan password visible), profil perusahaan, overview sistem
- **Internasionalisasi** — Bahasa Indonesia & English (toggle ID/EN)
- **Tema** — Light, Dark, & System (mengikuti OS)
- **Cetak PDF** — Invoice (template Tropisantara) & Purchase Order (template permintaan)
- **Import/Export** — Produk & Stok dengan pilihan kolom selektif

### Teknologi
- Next.js 15 (App Router) + TypeScript
- Prisma ORM (SQLite untuk dev, PostgreSQL untuk produksi)
- Tailwind CSS dengan dark mode
- NextAuth v5 (Auth.js) credentials
- Recharts untuk grafik cashflow
- PM2 untuk process management di VPS

### Pembuat
Dibangun kolaboratif oleh **Diky Ramadhan** (pemilik PT Provisio Permata Tropisantara — domain expert) bersama **Claude** (AI assistant Anthropic, via Claude Code) — dari sketsa kebutuhan sampai versi siap produksi.
