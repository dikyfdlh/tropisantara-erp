# Provisio ERP
**Sistem Manajemen Enterprise untuk PT Provisio Permata Tropisantara**

Aplikasi web terintegrasi yang menangani tiga lini bisnis perusahaan dalam satu platform:
- 🏭 **Manufaktur** — BOM, Production Order
- 🏗️ **Konstruksi** — Proyek, RAB, Termin, Progress
- 🛒 **Perdagangan** — Sales Order, Purchase Order, Invoice
- 📦 **Inventaris** — Stok per gudang
- 💰 **Keuangan** — Piutang (AR), Hutang (AP), Pembayaran
- 👥 **Master Data** — Pelanggan, Pemasok, Produk, Karyawan, Gudang, dll.

---

## 👥 Tentang Pembuatan

Project ini dibangun secara kolaboratif:

**Diky Fadihlah** — pemilik PT Provisio Permata Tropisantara
> Membawa kebutuhan bisnis riil, alur kerja perusahaan, keputusan produk, & feedback iteratif. Tahu persis cara perusahaan beroperasi — yang nggak ada di buku atau template ERP manapun.

**Claude** — AI assistant dari Anthropic
> Membantu menerjemahkan kebutuhan jadi kode: arsitektur, schema database, UI/UX, internasionalisasi, sampai dokumen deploy. Dipasangkan via Claude Code di VS Code.

Bukan pakai template jadi, bukan copy-paste dari GitHub. Setiap modul dibahas, dibangun, di-iterasi sampai sesuai kenyataan operasional di lapangan — dari pasangan dinding bata pakai SNI 8197:2015 sampai format invoice yang sesuai ekspektasi pelanggan kami.

> *"AI bukan pengganti manusia yang ngerti bisnisnya — dia pengganti programmer yang ngeluh kalau diminta revisi ke-50 kali."*

📑 **Dokumentasi proyek:**
- [SRS.md](SRS.md) — Software Requirements Specification (apa yang dibangun & untuk siapa)
- [SDD.md](SDD.md) — Software Design Document (bagaimana dibangun)

---

## 🛠️ Tech Stack
- **Next.js 15** (App Router) + **TypeScript**
- **Prisma ORM** — SQLite untuk dev, PostgreSQL untuk produksi
- **Tailwind CSS** + komponen UI internal
- **NextAuth v5** (Auth.js) — credentials + JWT session 8 jam
- **Zod** — validasi server-side
- **bcryptjs**, **date-fns**, **recharts**, **lucide-react**

---

## 🚀 Setup Cepat (Windows)

### Prasyarat
- **Node.js ≥ 20** ([download](https://nodejs.org)) — cek dengan `node -v`
- **pnpm** (recommended) atau npm — `npm install -g pnpm`

### Langkah

```powershell
# 1. Install dependencies
pnpm install
# atau: npm install

# 2. Copy .env.example menjadi .env
copy .env.example .env

# 3. Generate AUTH_SECRET acak dan paste ke .env
# Cara cepat:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 4. Setup database SQLite + seed data demo
pnpm setup
# atau: npm run setup
# (sama dengan: prisma generate && prisma db push && tsx prisma/seed.ts)

# ℹ️ Bila Anda sudah pernah setup sebelumnya & schema berubah (kolom baru),
#    paksa sinkron: `pnpm db:push` lalu `pnpm db:seed` untuk data demo terbaru.

# 5. Jalankan aplikasi
pnpm dev
# atau: npm run dev
```

Buka **http://localhost:3000** di browser.

### Akun Demo (sesudah seed)

**Akun Super (rahasia owner — tidak terlihat oleh role lain):**
| Email                  | Password             | Role        |
| ---------------------- | -------------------- | ----------- |
| owner@provisio.co.id   | super-rahasia-123    | Super Admin |

**Akun operasional:**
| Email                       | Password    | Role            |
| --------------------------- | ----------- | --------------- |
| admin@provisio.co.id        | admin123    | Administrator   |
| manager@provisio.co.id      | manager123  | Manager         |
| sales@provisio.co.id        | sales123    | Sales           |
| beli@provisio.co.id         | beli123     | Purchasing      |
| pm@provisio.co.id           | pm123       | Project Manager |
| produksi@provisio.co.id     | prod123     | Production      |
| gudang@provisio.co.id       | gudang123   | Warehouse       |
| akun@provisio.co.id         | akun123     | Accounting      |

> ⚠️ Login sebagai **owner@provisio.co.id** untuk mengakses **Super Admin area** —
> melihat semua akun beserta password, ubah profil perusahaan, dll. Role lain
> (termasuk ADMIN) tidak akan melihat menu ini sama sekali.

### Cetak Invoice → PDF
Buka detail invoice (mis. **`/perdagangan/invoices`** → pilih satu) → klik **"Cetak / PDF"**.
Halaman akan terbuka di tab baru dengan template Tropisantara (logo palem, header brand,
tabel produk, total, info CS WhatsApp). Dialog cetak browser akan muncul otomatis —
pilih **"Save as PDF"** untuk export.

### Konfigurasi tampilan invoice
Login sebagai owner → menu **Super Admin → Profil Perusahaan**.
Anda dapat mengubah:
- Logo (URL ke gambar) & warna aksen
- Alamat lengkap & kontak perusahaan
- **WhatsApp Customer Service** (tampil di footer invoice)
- Nomor rekening bank (tampil saat metode = Transfer)
- Catatan footer invoice

---

## 📂 Struktur Folder Singkat

```
src/
├── app/
│   ├── (auth)/login            ← halaman login
│   └── (app)/                  ← area aplikasi (butuh login)
│       ├── dashboard
│       ├── master/             ← customers, suppliers, products, employees, dll.
│       ├── manufaktur/         ← bom, production-orders
│       ├── konstruksi/         ← projects (RAB + Termin + Progress di dalam)
│       ├── perdagangan/        ← sales-orders, purchase-orders, invoices
│       ├── inventaris/         ← stock
│       ├── keuangan/           ← ar, ap
│       └── admin/users
├── components/                 ← UI primitives (button, table, card, badge, ...)
├── lib/                        ← db, auth, rbac, format, codegen
└── middleware.ts               ← proteksi route
prisma/
├── schema.prisma               ← model database
└── seed.ts                     ← data contoh
```

---

## 🗄️ Pindah ke PostgreSQL (Produksi)

1. Ubah `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL` di `.env` ke string koneksi PostgreSQL.
3. Jalankan migrasi:
   ```powershell
   pnpm db:migrate
   pnpm db:seed
   ```

---

## 📋 Script NPM

| Script             | Aksi                                                      |
| ------------------ | --------------------------------------------------------- |
| `pnpm dev`         | Jalankan dev server (hot reload) di port 3000             |
| `pnpm build`       | Build produksi                                            |
| `pnpm start`       | Jalankan hasil build produksi                             |
| `pnpm lint`        | ESLint                                                    |
| `pnpm typecheck`   | Pengecekan TypeScript tanpa emit                          |
| `pnpm db:generate` | Generate Prisma Client                                    |
| `pnpm db:push`     | Sinkron schema ke database (dev)                          |
| `pnpm db:migrate`  | Buat migrasi Prisma (prod)                                |
| `pnpm db:seed`     | Isi data contoh                                           |
| `pnpm db:studio`   | UI eksplorasi DB (Prisma Studio)                          |
| `pnpm setup`       | One-shot: generate + push + seed                          |

---

## 🧭 Roadmap Singkat

**Sudah jalan (MVP):**
- Auth + RBAC, 8 role
- Master Data lengkap
- BOM + Production Order (auto hitung kebutuhan bahan)
- Proyek + RAB + Termin + Progress
- Sales Order → Invoice → Payment (alur lengkap)
- Purchase Order
- Stok per gudang, AR aging, AP estimasi

**Backlog (Fase 2):**
- Delivery Order & GRN otomatis update stok (movement)
- PaymentOut (pembayaran ke supplier) & Bill
- Cetak PDF dokumen (SO/PO/Invoice/Termin)
- Audit log lengkap & approval workflow
- BI dashboard (chart trend, kontribusi per lini)
- Mobile app lapangan (scan barcode, foto progress)

---

## 📞 Kontak

Owner: **PT Provisio Permata Tropisantara**

Untuk pertanyaan teknis, periksa SDD.md atau diskusikan dengan tim engineering.
