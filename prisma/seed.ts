import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ---- Company Settings (singleton)
  await db.companySetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      companyName: 'PT Provisio Permata Tropisantara',
      brandName: 'TROPISANTARA',
      tagline: 'Manufaktur · Konstruksi · Perdagangan',
      npwp: '01.234.567.8-901.000',
      address: 'Jl. Raya Industri No. 123, Kawasan Industri',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      postalCode: '12345',
      phone: '+62 21 1234 5678',
      email: 'info@provisio.co.id',
      website: 'https://provisio.co.id',
      primaryColor: '#1f7a3a',
      invoiceFooter:
        'Invoice ini sah dan diproses oleh sistem.\nSilakan hubungi CS Tropisantara apabila membutuhkan bantuan.',
    },
  });

  // ---- Bank Accounts (multi)
  const existingBanks = await db.bankAccount.count({ where: { settingId: 'default' } });
  if (existingBanks === 0) {
    await db.bankAccount.createMany({
      data: [
        { settingId: 'default', bankName: 'BCA',     accountName: 'PT Provisio Permata Tropisantara', accountNumber: '1234567890', isPrimary: true,  sortOrder: 1 },
        { settingId: 'default', bankName: 'Mandiri', accountName: 'PT Provisio Permata Tropisantara', accountNumber: '0987654321', isPrimary: false, sortOrder: 2 },
      ],
    });
  }

  // ---- WhatsApp Contacts (multi)
  const existingWa = await db.whatsappContact.count({ where: { settingId: 'default' } });
  if (existingWa === 0) {
    await db.whatsappContact.createMany({
      data: [
        { settingId: 'default', label: 'CS Penjualan', number: '+62 821 1420 2006', sortOrder: 1 },
        { settingId: 'default', label: 'CS Logistik',  number: '+62 813 9999 8888', sortOrder: 2 },
      ],
    });
  }

  // ---- Users
  const pwd = (p: string) => bcrypt.hash(p, 10);
  const users = [
    // SUPER_ADMIN — disembunyikan dari ADMIN biasa. Hanya owner yang tahu kredensial ini.
    { email: 'owner@provisio.co.id',    name: 'Pemilik Perusahaan',    role: 'SUPER_ADMIN',     password: 'super-rahasia-123' },
    { email: 'admin@provisio.co.id',    name: 'Administrator',         role: 'ADMIN',           password: 'admin123' },
    { email: 'manager@provisio.co.id',  name: 'Manager Operasional',   role: 'MANAGER',         password: 'manager123' },
    { email: 'sales@provisio.co.id',    name: 'Staff Penjualan',       role: 'SALES',           password: 'sales123' },
    { email: 'beli@provisio.co.id',     name: 'Staff Pembelian',       role: 'PURCHASING',      password: 'beli123' },
    { email: 'pm@provisio.co.id',       name: 'Manager Proyek',        role: 'PROJECT_MANAGER', password: 'pm123' },
    { email: 'produksi@provisio.co.id', name: 'Supervisor Produksi',   role: 'PRODUCTION',      password: 'prod123' },
    { email: 'gudang@provisio.co.id',   name: 'Kepala Gudang',         role: 'WAREHOUSE',       password: 'gudang123' },
    { email: 'akun@provisio.co.id',     name: 'Staff Akuntansi',       role: 'ACCOUNTING',      password: 'akun123' },
  ];
  for (const u of users) {
    await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: await pwd(u.password), passwordPlain: u.password },
    });
  }

  // ---- UoM
  const uoms = [
    { code: 'PCS', name: 'Pieces' }, { code: 'KG', name: 'Kilogram' }, { code: 'M', name: 'Meter' },
    { code: 'M2', name: 'Meter Persegi' }, { code: 'M3', name: 'Meter Kubik' }, { code: 'LTR', name: 'Liter' },
    { code: 'BOX', name: 'Box' }, { code: 'SAK', name: 'Sak' }, { code: 'LS', name: 'Lump Sum' },
  ];
  for (const u of uoms) await db.uom.upsert({ where: { code: u.code }, update: {}, create: u });

  // ---- Kategori
  const cats = [
    { code: 'CAT-RM-LOG',  name: 'Bahan Baku Kayu',     type: 'RAW_MATERIAL' },
    { code: 'CAT-RM-LOG2', name: 'Bahan Baku Logam',    type: 'RAW_MATERIAL' },
    { code: 'CAT-RM-AGR',  name: 'Bahan Baku Agro',     type: 'RAW_MATERIAL' },
    { code: 'CAT-FG-MEB',  name: 'Furniture (FG)',      type: 'FINISHED_GOOD' },
    { code: 'CAT-FG-AGR',  name: 'Produk Agro (FG)',    type: 'FINISHED_GOOD' },
    { code: 'CAT-CS-SEM',  name: 'Material Konstruksi', type: 'CONSTRUCTION_MATERIAL' },
    { code: 'CAT-MD-ATK',  name: 'ATK & Perlengkapan',  type: 'MERCHANDISE' },
    { code: 'CAT-SV',      name: 'Jasa',                type: 'SERVICE' },
  ];
  for (const c of cats) await db.category.upsert({ where: { code: c.code }, update: {}, create: c });

  const uom = async (code: string) => (await db.uom.findUnique({ where: { code } }))!.id;
  const cat = async (code: string) => (await db.category.findUnique({ where: { code } }))!.id;

  // ---- Products
  const products = [
    { code: 'PRD-00001', name: 'Kayu Jati 10x10x200',   type: 'RAW',         catCode: 'CAT-RM-LOG',  uomCode: 'PCS', sellPrice: 0,       buyPrice: 350000, minStock: 20 },
    { code: 'PRD-00002', name: 'Plat Besi 1x2m',        type: 'RAW',         catCode: 'CAT-RM-LOG2', uomCode: 'PCS', sellPrice: 0,       buyPrice: 850000, minStock: 10 },
    { code: 'PRD-00003', name: 'Cat Duco Putih',        type: 'RAW',         catCode: 'CAT-RM-LOG',  uomCode: 'LTR', sellPrice: 0,       buyPrice: 95000,  minStock: 30 },
    { code: 'PRD-00010', name: 'Meja Kantor Direksi',   type: 'FG',          catCode: 'CAT-FG-MEB',  uomCode: 'PCS', sellPrice: 4500000, buyPrice: 0,      minStock: 2 },
    { code: 'PRD-00011', name: 'Kursi Eksekutif',       type: 'FG',          catCode: 'CAT-FG-MEB',  uomCode: 'PCS', sellPrice: 2750000, buyPrice: 0,      minStock: 4 },
    { code: 'PRD-00015', name: 'Arang Batok Kelapa',    type: 'FG',          catCode: 'CAT-FG-AGR',  uomCode: 'KG',  sellPrice: 12000,   buyPrice: 7500,   minStock: 200 },
    { code: 'PRD-00020', name: 'Semen Portland 50kg',   type: 'MERCHANDISE', catCode: 'CAT-CS-SEM',  uomCode: 'SAK', sellPrice: 72000,   buyPrice: 65000,  minStock: 100 },
    { code: 'PRD-00021', name: 'Pasir Cor (per m3)',    type: 'MERCHANDISE', catCode: 'CAT-CS-SEM',  uomCode: 'M3',  sellPrice: 250000,  buyPrice: 220000, minStock: 5 },
    { code: 'PRD-00022', name: 'Besi Beton Ø10mm',      type: 'MERCHANDISE', catCode: 'CAT-CS-SEM',  uomCode: 'PCS', sellPrice: 85000,   buyPrice: 78000,  minStock: 50 },
    { code: 'PRD-00030', name: 'Kertas A4 80gsm',       type: 'MERCHANDISE', catCode: 'CAT-MD-ATK',  uomCode: 'BOX', sellPrice: 55000,   buyPrice: 45000,  minStock: 20 },
    { code: 'PRD-00031', name: 'Pulpen Standar Biru',   type: 'MERCHANDISE', catCode: 'CAT-MD-ATK',  uomCode: 'PCS', sellPrice: 5000,    buyPrice: 3500,   minStock: 200 },
    { code: 'PRD-00040', name: 'Jasa Instalasi',        type: 'SERVICE',     catCode: 'CAT-SV',      uomCode: 'LS',  sellPrice: 2500000, buyPrice: 0,      minStock: 0 },
  ];
  for (const p of products) {
    await db.product.upsert({
      where: { code: p.code },
      update: {},
      create: {
        code: p.code, name: p.name, type: p.type,
        categoryId: await cat(p.catCode), uomId: await uom(p.uomCode),
        sellPrice: p.sellPrice, buyPrice: p.buyPrice, minStock: p.minStock,
      },
    });
  }

  // ---- Warehouses
  const warehouses = [
    { code: 'WH-001', name: 'Gudang Pusat',          type: 'GENERAL',      incharge: 'Budi' },
    { code: 'WH-002', name: 'Gudang Bahan Baku',     type: 'RAW_MATERIAL', incharge: 'Ali' },
    { code: 'WH-003', name: 'Gudang Barang Jadi',    type: 'FG',           incharge: 'Sari' },
    { code: 'WH-004', name: 'Gudang Proyek',         type: 'CONSTRUCTION', incharge: 'Joko' },
  ];
  for (const w of warehouses) await db.warehouse.upsert({ where: { code: w.code }, update: {}, create: w });

  // ---- Customers
  const customers = [
    {
      code: 'CUST-0001', name: 'PT Mitra Sejahtera Abadi', businessType: 'PT',
      city: 'Jakarta', province: 'DKI Jakarta', postalCode: '12950',
      address: 'Jl. Sudirman Kav. 25, Setiabudi', phone: '+62 21 555 1001',
      npwp: '01.234.567.8-901.000', paymentTerm: 30,
    },
    {
      code: 'CUST-0002', name: 'CV Bumi Konstruksi', businessType: 'CV',
      city: 'Bandung', province: 'Jawa Barat', postalCode: '40123',
      address: 'Jl. Ahmad Yani No. 88', phone: '+62 22 555 2002',
      npwp: '02.345.678.9-012.000', paymentTerm: 45,
    },
    {
      code: 'CUST-0003', name: 'Toko Cahaya Mandiri', businessType: 'UD',
      city: 'Surabaya', province: 'Jawa Timur',
      address: 'Jl. Tunjungan No. 17', phone: '+62 31 555 3003',
      paymentTerm: 14,
    },
    {
      code: 'CUST-0004', name: 'Warsid', businessType: 'Perorangan',
      city: 'Kabupaten Lebak', province: 'Banten',
      address: 'Jl. Raya Malingping',
      whatsapp: '+62 813 9999 8888', paymentTerm: 0,
    },
  ];
  for (const c of customers) {
    await db.customer.upsert({ where: { code: c.code }, update: {}, create: c });
  }

  // ---- Suppliers
  const suppliers = [
    { code: 'SUP-0001', name: 'PT Logam Indo Jaya',       businessType: 'PT', city: 'Tangerang', province: 'Banten',       paymentTerm: 30 },
    { code: 'SUP-0002', name: 'CV Kayu Nusantara',        businessType: 'CV', city: 'Jepara',    province: 'Jawa Tengah',  paymentTerm: 30 },
    { code: 'SUP-0003', name: 'PT Cat & Coating Sejati',  businessType: 'PT', city: 'Bekasi',    province: 'Jawa Barat',   paymentTerm: 14 },
    { code: 'SUP-0004', name: 'Toko Material Berkah',     businessType: 'UD', city: 'Bekasi',    province: 'Jawa Barat',   paymentTerm: 7 },
  ];
  for (const s of suppliers) {
    await db.supplier.upsert({ where: { code: s.code }, update: {}, create: s });
  }

  // ---- Employees
  const emps = [
    { code: 'EMP-0001', name: 'Budi Santoso',  position: 'Mandor',            division: 'CONSTRUCTION' },
    { code: 'EMP-0002', name: 'Joko Pranoto',  position: 'Mandor',            division: 'CONSTRUCTION' },
    { code: 'EMP-0003', name: 'Ahmad Hidayat', position: 'Tukang Kayu',       division: 'PRODUCTION' },
    { code: 'EMP-0004', name: 'Siti Aminah',   position: 'Operator Produksi', division: 'PRODUCTION' },
    { code: 'EMP-0005', name: 'Rina Wati',     position: 'Staff Admin',       division: 'ADMIN' },
  ];
  for (const e of emps) {
    await db.employee.upsert({ where: { code: e.code }, update: {}, create: { ...e, isActive: true } });
  }

  // ---- Initial Stock
  const wh001 = (await db.warehouse.findUnique({ where: { code: 'WH-001' } }))!.id;
  const wh002 = (await db.warehouse.findUnique({ where: { code: 'WH-002' } }))!.id;
  const wh003 = (await db.warehouse.findUnique({ where: { code: 'WH-003' } }))!.id;

  const stocks = [
    { prod: 'PRD-00001', wh: wh002, qty: 50 },
    { prod: 'PRD-00002', wh: wh002, qty: 25 },
    { prod: 'PRD-00003', wh: wh002, qty: 80 },
    { prod: 'PRD-00010', wh: wh003, qty: 5 },
    { prod: 'PRD-00011', wh: wh003, qty: 12 },
    { prod: 'PRD-00015', wh: wh003, qty: 1500 },
    { prod: 'PRD-00020', wh: wh001, qty: 150 },
    { prod: 'PRD-00022', wh: wh001, qty: 30 },
    { prod: 'PRD-00030', wh: wh001, qty: 35 },
    { prod: 'PRD-00031', wh: wh001, qty: 500 },
  ];
  for (const s of stocks) {
    const p = await db.product.findUnique({ where: { code: s.prod } });
    if (!p) continue;
    await db.stockLevel.upsert({
      where: { productId_warehouseId: { productId: p.id, warehouseId: s.wh } },
      update: { qty: s.qty },
      create: { productId: p.id, warehouseId: s.wh, qty: s.qty },
    });
  }

  // ---- Contoh SO + Invoice (demo cetak PDF — meniru template Tropisantara)
  const warsid = await db.customer.findUnique({ where: { code: 'CUST-0004' } });
  const arang  = await db.product.findUnique({ where: { code: 'PRD-00015' } });
  if (warsid && arang) {
    const existing = await db.salesOrder.findFirst({ where: { code: 'SO-2026-0001' } });
    if (!existing) {
      const qty = 1020;
      const price = 12000;
      const total = qty * price; // 12.240.000
      const so = await db.salesOrder.create({
        data: {
          code: 'SO-2026-0001',
          customerId: warsid.id,
          orderDate: new Date('2026-05-20'),
          deliveryDate: new Date('2026-05-25'),
          status: 'INVOICED',
          taxRate: 0,
          subtotal: total, tax: 0, total,
          notes: 'Pengiriman ke alamat customer, sudah termasuk biaya bongkar.',
          items: {
            create: [{ productId: arang.id, qty, unitPrice: price, discount: 0, total }],
          },
        },
      });
      await db.invoice.create({
        data: {
          code: 'INV-2026-05-0001',
          salesOrderId: so.id,
          date: new Date('2026-05-25'),
          dueDate: new Date('2026-05-25'),
          total,
          paymentMethod: 'COD',
          status: 'UNPAID',
        },
      });
    }
  }

  // ---- Work Item Templates (AHSP standar Indonesia / SNI)
  const wits = [
    // PERSIAPAN
    { code: 'WIT-001', name: 'Pembersihan lahan & pengukuran',          category: 'PERSIAPAN',  unit: 'm2', materialCost: 5000,    laborCost: 12000,   equipmentCost: 3000,   reference: 'AHSP 2.1' },
    { code: 'WIT-002', name: 'Bouwplank (pemasangan papan ukur)',       category: 'PERSIAPAN',  unit: 'm',  materialCost: 35000,   laborCost: 25000,   equipmentCost: 5000,   reference: 'AHSP 2.4' },
    // TANAH
    { code: 'WIT-010', name: 'Galian tanah biasa kedalaman 1m',         category: 'TANAH',      unit: 'm3', materialCost: 0,       laborCost: 95000,   equipmentCost: 15000,  reference: 'SNI 2835:2008' },
    { code: 'WIT-011', name: 'Urugan tanah kembali',                    category: 'TANAH',      unit: 'm3', materialCost: 0,       laborCost: 45000,   equipmentCost: 10000,  reference: 'SNI 2835:2008' },
    { code: 'WIT-012', name: 'Urugan pasir bawah pondasi',              category: 'TANAH',      unit: 'm3', materialCost: 220000,  laborCost: 35000,   equipmentCost: 5000,   reference: 'SNI 2835:2008' },
    // PONDASI
    { code: 'WIT-020', name: 'Pasangan pondasi batu kali 1:4',          category: 'PONDASI',    unit: 'm3', materialCost: 850000,  laborCost: 350000,  equipmentCost: 25000,  reference: 'SNI 6897:2008' },
    { code: 'WIT-021', name: 'Beton sloof 15x20 cm K-175',              category: 'PONDASI',    unit: 'm',  materialCost: 180000,  laborCost: 95000,   equipmentCost: 10000,  reference: 'SNI 7394:2008' },
    // BETON
    { code: 'WIT-030', name: 'Beton kolom struktur 20x20 K-225',        category: 'BETON',      unit: 'm3', materialCost: 1850000, laborCost: 850000,  equipmentCost: 95000,  reference: 'SNI 7394:2008' },
    { code: 'WIT-031', name: 'Beton balok lantai K-225',                category: 'BETON',      unit: 'm3', materialCost: 1850000, laborCost: 950000,  equipmentCost: 95000,  reference: 'SNI 7394:2008' },
    { code: 'WIT-032', name: 'Beton plat lantai t=12cm K-225',          category: 'BETON',      unit: 'm2', materialCost: 285000,  laborCost: 145000,  equipmentCost: 15000,  reference: 'SNI 7394:2008' },
    // PASANGAN
    { code: 'WIT-040', name: 'Pasangan dinding bata merah 1:4',         category: 'PASANGAN',   unit: 'm2', materialCost: 95000,   laborCost: 65000,   equipmentCost: 5000,   reference: 'SNI 8197:2015' },
    { code: 'WIT-041', name: 'Pasangan dinding batako 1:4',             category: 'PASANGAN',   unit: 'm2', materialCost: 75000,   laborCost: 55000,   equipmentCost: 5000,   reference: 'SNI 8197:2015' },
    // PLESTERAN
    { code: 'WIT-050', name: 'Plesteran dinding 1:4 tebal 1.5cm',       category: 'PLESTERAN',  unit: 'm2', materialCost: 28000,   laborCost: 35000,   equipmentCost: 2000,   reference: 'SNI 2837:2008' },
    { code: 'WIT-051', name: 'Acian dinding',                           category: 'PLESTERAN',  unit: 'm2', materialCost: 12000,   laborCost: 18000,   equipmentCost: 1000,   reference: 'SNI 2837:2008' },
    // ATAP
    { code: 'WIT-060', name: 'Rangka atap baja ringan',                 category: 'ATAP',       unit: 'm2', materialCost: 195000,  laborCost: 65000,   equipmentCost: 10000,  reference: 'AHSP 7.2' },
    { code: 'WIT-061', name: 'Penutup atap genteng metal',              category: 'ATAP',       unit: 'm2', materialCost: 85000,   laborCost: 35000,   equipmentCost: 5000,   reference: 'AHSP 7.5' },
    // LANTAI
    { code: 'WIT-070', name: 'Pasang keramik lantai 40x40',             category: 'LANTAI',     unit: 'm2', materialCost: 95000,   laborCost: 55000,   equipmentCost: 5000,   reference: 'SNI 7395:2008' },
    { code: 'WIT-071', name: 'Pasang keramik dinding 25x40',            category: 'LANTAI',     unit: 'm2', materialCost: 90000,   laborCost: 60000,   equipmentCost: 5000,   reference: 'SNI 7395:2008' },
    // PENGECATAN
    { code: 'WIT-080', name: 'Pengecatan dinding eksterior 2 lapis',    category: 'PENGECATAN', unit: 'm2', materialCost: 22000,   laborCost: 18000,   equipmentCost: 1500,   reference: 'SNI 8153:2015' },
    { code: 'WIT-081', name: 'Pengecatan dinding interior 2 lapis',     category: 'PENGECATAN', unit: 'm2', materialCost: 18000,   laborCost: 15000,   equipmentCost: 1500,   reference: 'SNI 8153:2015' },
    // PLAFON
    { code: 'WIT-090', name: 'Plafon gypsum + rangka hollow',           category: 'PLAFON',     unit: 'm2', materialCost: 95000,   laborCost: 55000,   equipmentCost: 5000,   reference: 'AHSP 9.3' },
    // KUSEN
    { code: 'WIT-100', name: 'Kusen pintu aluminium',                   category: 'KUSEN',      unit: 'm',  materialCost: 185000,  laborCost: 45000,   equipmentCost: 10000,  reference: 'AHSP 10.1' },
    { code: 'WIT-101', name: 'Daun pintu panel kayu',                   category: 'KUSEN',      unit: 'set',materialCost: 1850000, laborCost: 250000,  equipmentCost: 25000,  reference: 'AHSP 10.4' },
    { code: 'WIT-102', name: 'Jendela aluminium + kaca 5mm',            category: 'KUSEN',      unit: 'm2', materialCost: 850000,  laborCost: 95000,   equipmentCost: 15000,  reference: 'AHSP 10.7' },
    // SANITAIR
    { code: 'WIT-110', name: 'Pasang closet duduk lengkap',             category: 'SANITAIR',   unit: 'set',materialCost: 1850000, laborCost: 285000,  equipmentCost: 35000,  reference: 'AHSP 11.2' },
    { code: 'WIT-111', name: 'Pasang wastafel + kran',                  category: 'SANITAIR',   unit: 'set',materialCost: 850000,  laborCost: 195000,  equipmentCost: 25000,  reference: 'AHSP 11.5' },
    // LISTRIK
    { code: 'WIT-120', name: 'Instalasi titik lampu + saklar',          category: 'LISTRIK',    unit: 'titik',materialCost: 95000, laborCost: 65000,   equipmentCost: 5000,   reference: 'PUIL 2011' },
    { code: 'WIT-121', name: 'Instalasi titik stop kontak',             category: 'LISTRIK',    unit: 'titik',materialCost: 125000,laborCost: 75000,   equipmentCost: 5000,   reference: 'PUIL 2011' },
  ];
  for (const w of wits) {
    await db.workItemTemplate.upsert({ where: { code: w.code }, update: {}, create: w });
  }

  console.log('✅ Seed selesai.\n');
  console.log('🔑 Akun super admin (rahasia owner):');
  console.log('   owner@provisio.co.id / super-rahasia-123');
  console.log('\n🔑 Akun demo lainnya:');
  for (const u of users) {
    if (u.role !== 'SUPER_ADMIN') console.log(`   ${u.email} / ${u.password}  (${u.role})`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
