'use client';

import { useMemo, useState, useTransition } from 'react';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Select } from '@/components/ui/input';
import { formatRupiah } from '@/lib/format';
import { Plus, Trash2, Save, Calculator } from 'lucide-react';
import { saveBudgetAsProject } from './actions';

type Template = {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  reference: string;
};

type CustomerOpt = { id: string; code: string; name: string };

type Line = { templateId: string; qty: number };

const CAT_LABELS: Record<string, string> = {
  PERSIAPAN: 'Persiapan',
  TANAH: 'Pekerjaan Tanah',
  PONDASI: 'Pondasi',
  BETON: 'Beton',
  PASANGAN: 'Pasangan',
  PLESTERAN: 'Plesteran',
  KAYU: 'Kayu',
  ATAP: 'Atap',
  LANTAI: 'Lantai',
  PENGECATAN: 'Pengecatan',
  PLAFON: 'Plafon',
  KUSEN: 'Kusen/Pintu/Jendela',
  SANITAIR: 'Sanitair',
  LISTRIK: 'Listrik',
  LAINNYA: 'Lainnya',
};

export function BudgetCalculator({
  templates, customers,
}: { templates: Template[]; customers: CustomerOpt[] }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [filter, setFilter] = useState('');
  const [overheadPct, setOverheadPct] = useState(10);
  const [contingencyPct, setContingencyPct] = useState(5);
  const [ppnPct, setPpnPct] = useState(0);
  const [isPending, startTransition] = useTransition();

  const tplById = useMemo(() => new Map(templates.map((t) => [t.id, t])), [templates]);

  // Group templates by category for nicer UI
  const grouped = useMemo(() => {
    const f = filter.trim().toLowerCase();
    const filtered = !f ? templates : templates.filter((t) =>
      t.name.toLowerCase().includes(f) ||
      t.code.toLowerCase().includes(f) ||
      (CAT_LABELS[t.category] ?? t.category).toLowerCase().includes(f) ||
      t.reference.toLowerCase().includes(f),
    );
    const map = new Map<string, Template[]>();
    for (const t of filtered) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    return Array.from(map.entries());
  }, [templates, filter]);

  function addLine(templateId: string) {
    setLines((prev) => {
      const existing = prev.find((l) => l.templateId === templateId);
      if (existing) return prev.map((l) => l.templateId === templateId ? { ...l, qty: l.qty + 1 } : l);
      return [...prev, { templateId, qty: 1 }];
    });
  }
  function updateQty(idx: number, qty: number) {
    setLines((prev) => prev.map((l, i) => i === idx ? { ...l, qty } : l));
  }
  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  // Calculations
  const calcLines = lines.map((l) => {
    const t = tplById.get(l.templateId)!;
    const unitPrice = t.materialCost + t.laborCost + t.equipmentCost;
    const total = Math.round(unitPrice * l.qty);
    return { ...l, template: t, unitPrice, total };
  });

  const totalMaterial   = calcLines.reduce((s, r) => s + Math.round(r.template.materialCost * r.qty),  0);
  const totalLabor      = calcLines.reduce((s, r) => s + Math.round(r.template.laborCost * r.qty),     0);
  const totalEquipment  = calcLines.reduce((s, r) => s + Math.round(r.template.equipmentCost * r.qty), 0);
  const direct          = totalMaterial + totalLabor + totalEquipment;
  const overhead        = Math.round((direct * overheadPct) / 100);
  const contingency     = Math.round((direct * contingencyPct) / 100);
  const beforeTax       = direct + overhead + contingency;
  const ppn             = Math.round((beforeTax * ppnPct) / 100);
  const grandTotal      = beforeTax + ppn;

  // Form save
  const [customerId, setCustomerId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [location, setLocation] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const oneYearLater = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(oneYearLater);

  function onSave() {
    if (!customerId) { alert('Pilih klien dulu'); return; }
    if (!projectName.trim()) { alert('Isi nama proyek dulu'); return; }
    if (lines.length === 0) { alert('Tambahkan minimal 1 item pekerjaan'); return; }
    if (!confirm(`Simpan sebagai proyek baru dengan nilai kontrak ${formatRupiah(grandTotal)}?`)) return;

    startTransition(async () => {
      try {
        await saveBudgetAsProject({
          customerId, name: projectName, location: location || null,
          startDate, endDate,
          overheadPct, contingencyPct, ppnPct,
          lines,
        });
      } catch (e) {
        alert((e as Error).message);
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* ===== Katalog Template (kiri) ===== */}
      <Card className="lg:col-span-5">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Katalog Item Pekerjaan</h3>
          <p className="mt-1 text-xs text-slate-500">Klik untuk menambahkan ke daftar anggaran di kanan.</p>
          <div className="mt-3">
            <Input
              placeholder="Cari item (nama / kode / kategori / SNI)…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
        <CardBody className="max-h-[600px] space-y-3 overflow-y-auto !p-4">
          {grouped.length === 0 ? (
            <p className="text-sm text-slate-500">Tidak ada item cocok.</p>
          ) : grouped.map(([cat, items]) => (
            <div key={cat}>
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <span>{CAT_LABELS[cat] ?? cat}</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-400">{items.length} item</span>
              </div>
              <ul className="space-y-1">
                {items.map((t) => {
                  const unitPrice = t.materialCost + t.laborCost + t.equipmentCost;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => addLine(t.id)}
                        className="group flex w-full items-start justify-between gap-2 rounded-md border border-slate-200 p-2 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">{t.name}</span>
                            <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-500">{t.code}</code>
                            {t.reference && <Badge tone="sky" className="!text-[10px]">{t.reference}</Badge>}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            {formatRupiah(unitPrice)} / {t.unit}
                          </div>
                        </div>
                        <div className="text-brand-700 opacity-0 transition group-hover:opacity-100">
                          <Plus className="h-4 w-4" />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* ===== Anggaran (kanan) ===== */}
      <div className="space-y-4 lg:col-span-7">
        <Card>
          <div className="border-b border-slate-100 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Calculator className="h-4 w-4 text-brand-700" /> Daftar Anggaran
            </h3>
          </div>
          <CardBody className="!p-0">
            {lines.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Belum ada item. Pilih dari katalog di sebelah kiri.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">No</th>
                      <th className="px-3 py-2">Pekerjaan</th>
                      <th className="px-3 py-2">Satuan</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2 text-right">Harga Satuan</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calcLines.map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-slate-900">{r.template.name}</div>
                          <div className="text-xs text-slate-500">{r.template.code} · {CAT_LABELS[r.template.category] ?? r.template.category}</div>
                        </td>
                        <td className="px-3 py-2">{r.template.unit}</td>
                        <td className="px-3 py-2 w-24">
                          <Input
                            type="number" min={0.01} step={0.01}
                            value={r.qty}
                            onChange={(e) => updateQty(i, parseFloat(e.target.value || '0'))}
                          />
                        </td>
                        <td className="px-3 py-2 text-right">{formatRupiah(r.unitPrice)}</td>
                        <td className="px-3 py-2 text-right font-medium">{formatRupiah(r.total)}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button" onClick={() => removeLine(i)}
                            className="rounded p-1 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Breakdown */}
        <Card>
          <div className="border-b border-slate-100 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Rincian Biaya</h3>
          </div>
          <CardBody className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <BreakdownPill label="Material"      value={totalMaterial}  color="emerald" />
              <BreakdownPill label="Tenaga Kerja"  value={totalLabor}     color="sky" />
              <BreakdownPill label="Peralatan"     value={totalEquipment} color="amber" />
            </div>

            <div className="rounded-md border border-slate-200 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Subtotal (Biaya Langsung)</span>
                <span className="font-medium">{formatRupiah(direct)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <Label>Overhead &amp; Profit (%)</Label>
                <Input type="number" min={0} max={100} step={0.5}
                  value={overheadPct} onChange={(e) => setOverheadPct(parseFloat(e.target.value || '0'))} />
                <div className="mt-1 text-xs text-slate-500">= {formatRupiah(overhead)}</div>
              </div>
              <div>
                <Label>Kontingensi / Risk (%)</Label>
                <Input type="number" min={0} max={100} step={0.5}
                  value={contingencyPct} onChange={(e) => setContingencyPct(parseFloat(e.target.value || '0'))} />
                <div className="mt-1 text-xs text-slate-500">= {formatRupiah(contingency)}</div>
              </div>
              <div>
                <Label>PPN (%) <span className="text-xs text-slate-400">(opsional)</span></Label>
                <Input type="number" min={0} max={100} step={0.5}
                  value={ppnPct} onChange={(e) => setPpnPct(parseFloat(e.target.value || '0'))} />
                <div className="mt-1 text-xs text-slate-500">= {formatRupiah(ppn)}</div>
              </div>
            </div>

            <div className="rounded-md border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-brand-100/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-brand-700">Estimasi Nilai Kontrak</div>
                  <div className="mt-1 text-2xl font-bold text-brand-900">{formatRupiah(grandTotal)}</div>
                </div>
                <Calculator className="h-10 w-10 text-brand-300" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 md:grid-cols-4">
                <div>Direct: <strong>{formatRupiah(direct)}</strong></div>
                <div>+Overhead: <strong>{formatRupiah(overhead)}</strong></div>
                <div>+Kontingensi: <strong>{formatRupiah(contingency)}</strong></div>
                <div>+PPN: <strong>{formatRupiah(ppn)}</strong></div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Simpan sebagai proyek */}
        <Card>
          <div className="border-b border-slate-100 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Save className="h-4 w-4 text-emerald-700" /> Simpan sebagai Proyek Baru
            </h3>
            <p className="mt-1 text-xs text-slate-500">Anggaran akan dijadikan RAB awal proyek dengan status PLANNING.</p>
          </div>
          <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Nama Proyek *</Label>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Pembangunan Gudang Cabang Bekasi" />
            </div>
            <div>
              <Label>Klien *</Label>
              <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">— pilih klien —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>Lokasi</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <Label>Tgl Mulai *</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>Tgl Selesai *</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="button" onClick={onSave} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="h-4 w-4" /> {isPending ? 'Menyimpan…' : 'Simpan sebagai Proyek'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function BreakdownPill({
  label, value, color,
}: { label: string; value: number; color: 'emerald' | 'sky' | 'amber' }) {
  const cls =
    color === 'emerald' ? 'from-emerald-50 to-emerald-100 text-emerald-900 ring-emerald-200' :
    color === 'sky'     ? 'from-sky-50 to-sky-100 text-sky-900 ring-sky-200' :
                          'from-amber-50 to-amber-100 text-amber-900 ring-amber-200';
  return (
    <div className={`rounded-md bg-gradient-to-br ${cls} p-3 ring-1 ring-inset`}>
      <div className="text-[11px] uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-1 text-base font-semibold">{formatRupiah(value)}</div>
    </div>
  );
}
