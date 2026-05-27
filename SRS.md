# Software Requirements Specification (SRS)
## Sistem Manajemen Enterprise — PT Provisio Permata Tropisantara

| Field         | Value                                       |
| ------------- | ------------------------------------------- |
| Versi         | 1.0                                         |
| Tanggal       | 2026-05-24                                  |
| Perusahaan    | PT Provisio Permata Tropisantara            |
| Lini Bisnis   | Manufaktur, Konstruksi, Perdagangan         |
| Tipe Aplikasi | Web Application (Multi-user, Browser-based) |

---

## 1. Pendahuluan

### 1.1 Tujuan Dokumen
Dokumen ini mendefinisikan kebutuhan fungsional dan non-fungsional untuk aplikasi **Enterprise Management** PT Provisio Permata Tropisantara. Aplikasi ini bertujuan menjadi *single source of truth* terintegrasi yang menangani tiga lini bisnis perusahaan dalam satu platform.

### 1.2 Lingkup Sistem
Aplikasi web terintegrasi yang mencakup:
- **Master Data** terpusat (pelanggan, pemasok, produk, karyawan, gudang)
- **Manufaktur** — produksi barang dari bahan baku
- **Konstruksi** — manajemen proyek konstruksi
- **Perdagangan** — penjualan & pembelian barang
- **Inventaris** — stok lintas lini bisnis
- **Keuangan dasar** — piutang, hutang, jurnal
- **Manajemen Pengguna** dengan role-based access control (RBAC)

### 1.3 Definisi & Singkatan
| Istilah | Arti                                          |
| ------- | --------------------------------------------- |
| BOM     | Bill of Materials — komposisi bahan baku      |
| WIP     | Work in Progress — barang setengah jadi       |
| RAB     | Rencana Anggaran Biaya                        |
| PO      | Purchase Order — pesanan pembelian            |
| SO      | Sales Order — pesanan penjualan               |
| DO      | Delivery Order — surat jalan                  |
| GRN     | Goods Receipt Note — bukti terima barang      |
| AR/AP   | Accounts Receivable/Payable (Piutang/Hutang)  |
| RBAC    | Role-Based Access Control                     |
| UoM     | Unit of Measure (satuan: pcs, kg, m, m³, dll) |

---

## 2. Deskripsi Umum

### 2.1 Perspektif Sistem
Sistem berdiri sendiri (standalone web app), namun dirancang modular sehingga setiap lini bisnis dapat dikembangkan tanpa mengganggu yang lain. Master Data digunakan bersama oleh ketiga modul bisnis.

### 2.2 Karakteristik Pengguna
| Role             | Jumlah Estimasi | Tugas Utama                                              |
| ---------------- | --------------- | -------------------------------------------------------- |
| Admin            | 1–2             | Kelola user, master data, konfigurasi sistem             |
| Manager          | 1–3             | Lihat semua data, approval, laporan eksekutif            |
| Production       | 2–4             | Kelola BOM, Production Order, stok bahan baku            |
| Project Manager  | 2–4             | Kelola proyek konstruksi, RAB, termin                    |
| Sales            | 2–4             | Kelola pelanggan, sales order, invoice                   |
| Purchasing       | 1–2             | Kelola supplier, purchase order, GRN                     |
| Warehouse        | 2–3             | Kelola stok masuk/keluar, stock opname                   |
| Accounting       | 1–2             | Kelola piutang, hutang, jurnal, laporan keuangan         |

**Total estimasi:** 12–24 user (cukup untuk skala 5–20).

### 2.3 Batasan
- Browser modern (Chrome, Edge, Firefox versi 2 tahun terakhir).
- Bahasa antarmuka: **Bahasa Indonesia**.
- Mata uang: **IDR** (Rupiah).
- Format tanggal: `DD-MM-YYYY`.
- Zona waktu default: **Asia/Jakarta (WIB)**.

---

## 3. Kebutuhan Fungsional

### 3.1 Modul Autentikasi & RBAC (FR-AUTH)
| ID         | Kebutuhan                                                                          |
| ---------- | ---------------------------------------------------------------------------------- |
| FR-AUTH-01 | Sistem login dengan email + password (hashed bcrypt).                              |
| FR-AUTH-02 | Session berbasis cookie httpOnly (NextAuth/Auth.js).                               |
| FR-AUTH-03 | Logout & auto-logout setelah idle 8 jam.                                           |
| FR-AUTH-04 | Admin dapat membuat, mengedit, menonaktifkan user.                                 |
| FR-AUTH-05 | Setiap user memiliki minimal satu role; route diproteksi sesuai role.              |
| FR-AUTH-06 | Audit log: catat siapa membuat/mengubah dokumen penting (PO, SO, Termin).          |

### 3.2 Modul Master Data (FR-MD)
| ID       | Kebutuhan                                                                  |
| -------- | -------------------------------------------------------------------------- |
| FR-MD-01 | CRUD Pelanggan (customer) — kode, nama, NPWP, alamat, kontak, term         |
| FR-MD-02 | CRUD Pemasok (supplier) — kode, nama, NPWP, alamat, kontak, term           |
| FR-MD-03 | CRUD Produk/Barang — kode, nama, kategori, UoM, harga jual, harga beli     |
| FR-MD-04 | CRUD Karyawan — NIK, nama, jabatan, divisi, status aktif                   |
| FR-MD-05 | CRUD Gudang — kode, nama, alamat, penanggung jawab                         |
| FR-MD-06 | CRUD Kategori Produk (manufaktur, konstruksi, dagang)                      |
| FR-MD-07 | CRUD UoM (satuan ukur)                                                     |
| FR-MD-08 | Setiap master data memiliki kode unik auto-generate (CUST-0001 dll)        |
| FR-MD-09 | Soft delete (status non-aktif) untuk seluruh master data                   |

### 3.3 Modul Dashboard (FR-DASH)
| ID         | Kebutuhan                                                          |
| ---------- | ------------------------------------------------------------------ |
| FR-DASH-01 | KPI cards: total penjualan bulan ini, PO bulan ini, proyek aktif   |
| FR-DASH-02 | KPI cards: jumlah Production Order WIP, stok kritis (low stock)    |
| FR-DASH-03 | Grafik tren penjualan 6 bulan terakhir                             |
| FR-DASH-04 | Daftar dokumen butuh approval                                      |
| FR-DASH-05 | Daftar proyek konstruksi mendekati deadline                        |

### 3.4 Modul Manufaktur (FR-MFG)
| ID        | Kebutuhan                                                                       |
| --------- | ------------------------------------------------------------------------------- |
| FR-MFG-01 | CRUD BOM (Bill of Materials): produk jadi + daftar bahan baku & qty per unit    |
| FR-MFG-02 | Buat Production Order: pilih produk, qty target, tanggal mulai, deadline        |
| FR-MFG-03 | Production Order otomatis menghitung kebutuhan bahan baku berdasarkan BOM       |
| FR-MFG-04 | Status Production Order: DRAFT → PLANNED → IN_PROGRESS → COMPLETED → CANCELLED  |
| FR-MFG-05 | Material Issue: catat pengeluaran bahan baku dari gudang ke produksi            |
| FR-MFG-06 | Production Receipt: catat barang jadi masuk ke gudang FG                        |
| FR-MFG-07 | Laporan: realisasi vs rencana produksi, waste material                          |

### 3.5 Modul Konstruksi (FR-CON)
| ID        | Kebutuhan                                                                |
| --------- | ------------------------------------------------------------------------ |
| FR-CON-01 | CRUD Proyek: nama, klien, lokasi, nilai kontrak, tanggal mulai-selesai   |
| FR-CON-02 | RAB (Rencana Anggaran Biaya) per proyek: item pekerjaan, qty, harga      |
| FR-CON-03 | Termin pembayaran: jumlah termin, % nilai kontrak, syarat                |
| FR-CON-04 | Progress lapangan: laporan harian/mingguan, % penyelesaian per item RAB  |
| FR-CON-05 | Material proyek: tracking material yang dipakai vs RAB                   |
| FR-CON-06 | Manpower: daftar tukang/mandor, alokasi per proyek                       |
| FR-CON-07 | Status Proyek: PLANNING → ACTIVE → ON_HOLD → COMPLETED → CANCELLED       |
| FR-CON-08 | Laporan: cost vs RAB, progress fisik vs schedule (S-curve sederhana)     |

### 3.6 Modul Perdagangan (FR-TRD)
| ID        | Kebutuhan                                                                 |
| --------- | ------------------------------------------------------------------------- |
| FR-TRD-01 | CRUD Sales Order: pelanggan, item, qty, harga, diskon, PPN, total         |
| FR-TRD-02 | Status SO: DRAFT → CONFIRMED → DELIVERED → INVOICED → PAID → CANCELLED    |
| FR-TRD-03 | CRUD Purchase Order: supplier, item, qty, harga, total                    |
| FR-TRD-04 | Status PO: DRAFT → SENT → PARTIAL → RECEIVED → CANCELLED                  |
| FR-TRD-05 | Delivery Order (surat jalan) dari SO                                      |
| FR-TRD-06 | Goods Receipt Note (GRN) dari PO                                          |
| FR-TRD-07 | Invoice (penjualan) dari SO/DO                                            |
| FR-TRD-08 | Cetak/Export PDF untuk SO, PO, DO, GRN, Invoice                           |

### 3.7 Modul Inventaris (FR-INV)
| ID        | Kebutuhan                                                                  |
| --------- | -------------------------------------------------------------------------- |
| FR-INV-01 | Stock card: histori stok per item per gudang                               |
| FR-INV-02 | Stock movement otomatis dari Material Issue, GRN, Production Receipt, DO   |
| FR-INV-03 | Stock Adjustment manual dengan alasan & approval                           |
| FR-INV-04 | Stock Opname (stock take) dengan selisih                                   |
| FR-INV-05 | Alert stok di bawah minimum (reorder point)                                |

### 3.8 Modul Keuangan Dasar (FR-FIN)
| ID        | Kebutuhan                                                            |
| --------- | -------------------------------------------------------------------- |
| FR-FIN-01 | Accounts Receivable: daftar invoice belum lunas + aging               |
| FR-FIN-02 | Accounts Payable: daftar PO/tagihan supplier belum dibayar + aging    |
| FR-FIN-03 | Catat pembayaran invoice (parsial/full)                              |
| FR-FIN-04 | Catat pembayaran ke supplier                                         |
| FR-FIN-05 | Laporan cashflow sederhana (in/out per bulan)                        |

---

## 4. Kebutuhan Non-Fungsional

| ID        | Kebutuhan                                                                   |
| --------- | --------------------------------------------------------------------------- |
| NFR-PERF  | Halaman list (1000 baris) load < 2 detik di koneksi 10 Mbps.                |
| NFR-SEC-1 | Password di-hash dengan bcrypt cost ≥ 10.                                   |
| NFR-SEC-2 | Semua mutating endpoint membutuhkan session valid + cek role.               |
| NFR-SEC-3 | Validasi input server-side via Zod; tolak SQL injection & XSS.              |
| NFR-SEC-4 | Audit log immutable untuk dokumen approval (PO/SO/Termin).                  |
| NFR-USE   | UI dalam Bahasa Indonesia, mobile-responsive sampai ≥ 360px.                |
| NFR-AVL   | Target uptime 99% (dikelola host: Vercel/VPS).                              |
| NFR-BAK   | Backup database harian otomatis (cron); retensi 30 hari.                    |
| NFR-COMP  | Cetak dokumen mengikuti format pajak Indonesia (PPN 11%, NPWP, dll).        |
| NFR-LOC   | Default bahasa: id-ID; zona waktu: Asia/Jakarta.                            |

---

## 5. Matriks Role × Modul

| Modul         | Admin | Manager | Production | ProjectMgr | Sales | Purchasing | Warehouse | Accounting |
| ------------- | :---: | :-----: | :--------: | :--------: | :---: | :--------: | :-------: | :--------: |
| User Mgmt     | CRUD  |    R    |     —      |     —      |   —   |     —      |     —     |     —      |
| Master Data   | CRUD  |    R    |     R      |     R      |   R   |     R      |     R     |     R      |
| Manufaktur    | CRUD  |    R    |    CRUD    |     —      |   —   |     —      |     R     |     R      |
| Konstruksi    | CRUD  |    R    |     —      |    CRUD    |   —   |     —      |     R     |     R      |
| Sales/SO      | CRUD  |    R    |     —      |     —      | CRUD  |     —      |     R     |     R      |
| Purchase/PO   | CRUD  |    R    |     —      |     —      |   —   |    CRUD    |     R     |     R      |
| Inventaris    | CRUD  |    R    |     R      |     R      |   R   |     R      |   CRUD    |     R      |
| Keuangan      | CRUD  |    R    |     —      |     —      |   —   |     —      |     —     |    CRUD    |
| Dashboard     |   R   |    R    |     R      |     R      |   R   |     R      |     R     |     R      |

`CRUD` = Create/Read/Update/Delete · `R` = Read-only · `—` = Tidak dapat akses

---

## 6. Asumsi & Ketergantungan

1. Server hosting menyediakan PostgreSQL 14+ (atau SQLite untuk dev lokal).
2. Pengguna memiliki koneksi internet stabil minimum 5 Mbps.
3. Email SMTP tersedia untuk notifikasi (opsional pada MVP).
4. Tidak ada integrasi langsung ke sistem perpajakan/eksternal pada MVP — diekspor sebagai PDF/Excel.

---

## 7. Roadmap MVP → Future

**MVP (Saat ini, 2026):**
- Semua modul fungsional pada bagian 3.1–3.8 dengan kompleksitas dasar.
- 1 perusahaan, 1 mata uang (IDR).

**Future (Fase 2):**
- Multi-cabang/perusahaan, multi-mata uang.
- Integrasi e-Faktur DJP & SPT otomatis.
- Mobile app khusus lapangan (progress konstruksi, stock opname dengan scan barcode).
- HRD lengkap (payroll, absensi).
- BI dashboard advanced + forecasting.

---

*Dokumen ini hidup. Setiap perubahan kebutuhan harus di-update di sini dan ditautkan ke SDD.md untuk implementasi.*
