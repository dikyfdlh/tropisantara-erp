# Deploy ke VPS — Provisio ERP

Panduan deploy aplikasi ini ke VPS Linux (Ubuntu/Debian) dengan subdomain `enterprise.tropisantara.com`, **tanpa mengganggu** web Anda yang sudah ada di `gallerinusantara.tropisantara.com`.

## 📐 Arsitektur

```
                  Internet
                     │
                     ▼
           ┌─────────────────────┐
           │  DNS: tropisantara  │
           │  ─ gallerinusantara │ → A record → IP VPS
           │  ─ enterprise       │ → A record → IP VPS
           └─────────────────────┘
                     │
                     ▼
      ┌──────────────────────────────────┐
      │       VPS Anda (1 server)        │
      │                                  │
      │   ┌───── Nginx (port 80/443) ─┐  │
      │   │     reverse proxy         │  │
      │   └─┬──────────────────┬──────┘  │
      │     │                  │         │
      │     ▼                  ▼         │
      │  gallerinusantara   enterprise   │
      │   (sudah ada)       (Next.js)    │
      │   port 8080?         port 3000   │
      └──────────────────────────────────┘
```

**Konsep:** Nginx jadi "satpam pintu masuk" — baca subdomain dari Host header, lalu teruskan ke aplikasi yang sesuai di port lokal yang berbeda. Setiap aplikasi tetap berdiri sendiri.

---

## 1. Setup DNS

Login ke registrar/control panel DNS Anda (Cloudflare, Domainesia, IDwebhost, dll.) untuk domain `tropisantara.com`. Tambah satu record baru:

| Type | Name         | Value            | TTL   | Proxy (Cloudflare) |
| ---- | ------------ | ---------------- | ----- | ------------------ |
| A    | `enterprise` | `<IP VPS Anda>`  | Auto  | Aktifkan (orange ☁️) — opsional |

> IP VPS sama persis dengan IP yang Anda pakai untuk `gallerinusantara`. Cek dengan: `dig +short gallerinusantara.tropisantara.com`.

Tunggu 1–5 menit, lalu verifikasi:
```bash
dig +short enterprise.tropisantara.com
# Harus mengembalikan IP VPS Anda
```

---

## 2. Persiapan VPS

SSH ke VPS:
```bash
ssh user@<ip-vps>
```

### 2.1 Install Node.js 20 LTS (kalau belum ada)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # harus v20.x
npm -v
```

### 2.2 Install PM2 (process manager)
```bash
sudo npm install -g pm2
```

### 2.3 PostgreSQL (recommended untuk produksi)
```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql

# Di dalam psql:
CREATE USER provisio WITH PASSWORD 'GANTI_PASSWORD_KUAT_INI';
CREATE DATABASE provisio_erp OWNER provisio;
GRANT ALL PRIVILEGES ON DATABASE provisio_erp TO provisio;
\q
```

> **Alternatif SQLite (lebih sederhana)**: skip langkah ini dan biarkan `DATABASE_URL="file:./prisma/dev.db"`. Cocok untuk skala kecil (< 5 user concurrent).

---

## 3. Deploy aplikasi

### 3.1 Upload kode
Dua opsi:

**Opsi A — Git (recommended)**
```bash
cd /var/www
sudo git clone https://github.com/your-username/provisio-erp.git enterprise
sudo chown -R $USER:$USER /var/www/enterprise
cd enterprise
```

**Opsi B — SCP/RSync dari komputer Anda**
```bash
# Dari komputer lokal (PowerShell)
scp -r "x:\Bisnis\Enterprise Management" user@vps-ip:/var/www/enterprise
```

### 3.2 Konfigurasi `.env` produksi
```bash
cd /var/www/enterprise
cp .env.example .env
nano .env
```

Isi:
```dotenv
# Database — PostgreSQL produksi
DATABASE_URL="postgresql://provisio:GANTI_PASSWORD_KUAT_INI@localhost:5432/provisio_erp?schema=public"

# Auth — WAJIB generate baru, jangan pakai default!
AUTH_SECRET="<jalankan: openssl rand -base64 32>"
AUTH_TRUST_HOST=true

# URL produksi
NEXTAUTH_URL="https://enterprise.tropisantara.com"
```

Generate AUTH_SECRET:
```bash
openssl rand -base64 32
# Copy output ke AUTH_SECRET
```

### 3.3 Ganti provider Prisma ke PostgreSQL
Edit `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"   // ← ganti dari "sqlite"
  url      = env("DATABASE_URL")
}
```

### 3.4 Install dependencies, build, seed
```bash
npm install
npx prisma generate
npx prisma db push           # buat seluruh tabel
npm run db:seed              # isi data demo (opsional di produksi)
npm run build                # build Next.js
```

> ⚠️ **Jangan jalankan `db:seed` di produksi yang sudah berisi data real**. Hanya untuk first deploy.

### 3.5 Jalankan dengan PM2
Buat file [ecosystem.config.cjs](ecosystem.config.cjs) (sudah saya siapkan di project). Lalu:

```bash
pm2 start ecosystem.config.cjs
pm2 save                # simpan konfigurasi
pm2 startup             # auto-start saat reboot — ikuti instruksi yang muncul
pm2 logs provisio-erp   # cek log
```

Cek aplikasi sudah running:
```bash
curl http://localhost:3001
# atau di browser VPS: http://<ip-vps>:3001
```

---

## 4. Nginx reverse proxy

### 4.1 Install Nginx (kalau belum)
```bash
sudo apt install -y nginx
```

### 4.2 Buat config baru untuk subdomain
```bash
sudo nano /etc/nginx/sites-available/enterprise.tropisantara.com
```

Paste:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name enterprise.tropisantara.com;

    # ACME challenge (untuk SSL nanti)
    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name enterprise.tropisantara.com;

    # SSL — diisi oleh certbot setelah langkah 5
    # ssl_certificate     /etc/letsencrypt/live/enterprise.tropisantara.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/enterprise.tropisantara.com/privkey.pem;

    # Upload size — untuk logo upload, dll.
    client_max_body_size 10M;

    # Proxy ke Next.js (PM2 di port 3001)
    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # Static assets dilayani Next.js, tapi cache di nginx
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### 4.3 Aktifkan & reload
```bash
sudo ln -s /etc/nginx/sites-available/enterprise.tropisantara.com /etc/nginx/sites-enabled/
sudo nginx -t                 # validasi config — harus "syntax is ok"
sudo systemctl reload nginx
```

> ✅ **Web Anda yang sudah ada (`gallerinusantara`) tidak akan tersentuh** karena config-nya di file terpisah (`/etc/nginx/sites-available/gallerinusantara.*`).

---

## 5. SSL HTTPS via Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d enterprise.tropisantara.com
```

Certbot otomatis:
- Generate sertifikat Let's Encrypt
- Edit config Nginx untuk pakai SSL (uncomment baris `ssl_certificate`)
- Setup auto-renewal (cek dengan: `sudo certbot renew --dry-run`)

Setelah selesai, buka **https://enterprise.tropisantara.com** di browser. Harus muncul halaman login dengan padlock 🔒.

---

## 6. Verifikasi

| Test | Cara | Ekspektasi |
| ---- | ---- | ---------- |
| DNS | `dig +short enterprise.tropisantara.com` | IP VPS Anda |
| HTTP→HTTPS | `curl -I http://enterprise.tropisantara.com` | Status 301 ke https |
| App | Buka `https://enterprise.tropisantara.com` di browser | Halaman login |
| Login | Login dengan `owner@provisio.co.id` | Masuk ke dashboard |
| Web lama | Buka `https://gallerinusantara.tropisantara.com` | Masih jalan normal |

---

## 7. Update aplikasi (deployment selanjutnya)

```bash
cd /var/www/enterprise
git pull                          # tarik perubahan terbaru
npm install                       # install deps baru kalau ada
npx prisma migrate deploy         # jalankan migrasi DB (kalau ada perubahan schema)
npm run build                     # build ulang
pm2 reload provisio-erp           # restart tanpa downtime
```

---

## 8. Backup database (sangat direkomendasikan)

Buat script `/usr/local/bin/backup-provisio.sh`:
```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/var/backups/provisio
mkdir -p $BACKUP_DIR
PGPASSWORD='GANTI_PASSWORD_KUAT_INI' pg_dump -U provisio -h localhost provisio_erp \
  | gzip > $BACKUP_DIR/provisio_erp_$TIMESTAMP.sql.gz

# Hapus backup > 30 hari
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete
```

Jadwalkan harian via cron:
```bash
sudo chmod +x /usr/local/bin/backup-provisio.sh
sudo crontab -e
# Tambahkan baris:
0 2 * * * /usr/local/bin/backup-provisio.sh
```

---

## 9. Firewall

Pastikan port HTTP/HTTPS terbuka, sisanya tertutup:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Port **3001** TIDAK perlu dibuka ke publik — hanya Nginx (lewat 127.0.0.1) yang akses.

---

## Troubleshooting

| Masalah | Solusi |
| ------- | ------ |
| `502 Bad Gateway` | PM2 mati. Cek: `pm2 status`, restart: `pm2 restart provisio-erp` |
| SSL warning | Pastikan DNS sudah propagasi sebelum jalankan certbot |
| Port 3001 bentrok dgn web lama | Edit `PORT` di `ecosystem.config.cjs` ke port lain (3002, 4000, dst.) |
| Login bilang "Invalid" tapi password benar | `AUTH_SECRET` di `.env` tidak boleh kosong/lemah. Generate ulang |
| Upload logo gagal | Pastikan `client_max_body_size 10M;` di Nginx, restart nginx |
| Database error after `git pull` | Jalankan `npx prisma migrate deploy` atau `npx prisma db push` |

---

## Estimasi spec VPS

Untuk 5–20 user concurrent:
- **2 GB RAM** (minimum — Next.js + PostgreSQL + nginx)
- **2 vCPU**
- **20 GB SSD**

Contoh provider Indonesia: Niagahoster VPS X1, Domainesia VPS Basic, Indowebsite. Internasional: DigitalOcean Basic Droplet $12/mo, Hetzner CX21 €5.83/mo.
