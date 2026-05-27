'use client';

import { useState, useTransition } from 'react';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import { importStock, type StockImportResult } from './actions';

type Column = { key: string; label: string; required: boolean; importable: boolean; hint?: string };

export function StockIOPanel({ columns }: { columns: Column[] }) {
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(columns.map((c) => [c.key, true])),
  );
  const [result, setResult] = useState<StockImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(key: string) {
    setSelected((p) => ({ ...p, [key]: !p[key] }));
  }
  function selectAll(v: boolean) {
    setSelected(Object.fromEntries(columns.map((c) => [c.key, v || c.required])));
  }

  const exportKeys = columns
    .filter((c) => selected[c.key] || c.required)
    .map((c) => c.key);

  const importKeys = columns
    .filter((c) => c.importable && (selected[c.key] || c.required))
    .map((c) => c.key);

  function buildExportUrl() {
    const params = new URLSearchParams();
    exportKeys.forEach((k) => params.append('columns', k));
    return `/api/export/stock?${params.toString()}`;
  }

  async function onImportSubmit(formData: FormData) {
    importKeys.forEach((k) => formData.append('columns', k));
    startTransition(async () => {
      const res = await importStock(formData);
      setResult(res);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Pilih Kolom</h3>
          <div className="flex gap-1">
            <button type="button" onClick={() => selectAll(true)}
              className="text-xs font-medium text-brand-700 hover:underline">Pilih semua</button>
            <span className="text-xs text-slate-300">·</span>
            <button type="button" onClick={() => selectAll(false)}
              className="text-xs font-medium text-slate-500 hover:underline">Hapus pilihan</button>
          </div>
        </div>
        <CardBody className="space-y-2">
          {columns.map((c) => (
            <label key={c.key}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 p-2 transition hover:border-brand-300 hover:bg-brand-50/40">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300"
                checked={selected[c.key] || c.required}
                disabled={c.required}
                onChange={() => toggle(c.key)}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{c.label}</span>
                  <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-500">{c.key}</code>
                  {c.required && <Badge tone="amber" className="!text-[10px]">wajib</Badge>}
                  {!c.importable && <Badge tone="slate" className="!text-[10px]">export only</Badge>}
                </div>
                {c.hint && <p className="mt-0.5 text-xs text-slate-500">{c.hint}</p>}
              </div>
            </label>
          ))}
          <div className="rounded-md bg-slate-50 p-2 text-xs text-slate-500">
            <p>Export memakai: <code>{exportKeys.join(', ')}</code></p>
            <p className="mt-0.5">Import memakai: <code>{importKeys.join(', ')}</code></p>
          </div>
        </CardBody>
      </Card>

      <div className="space-y-4 lg:col-span-2">
        <Card hoverable>
          <div className="border-b border-slate-100 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Download className="h-4 w-4 text-brand-700" /> Export Stok
            </h3>
            <p className="mt-1 text-xs text-slate-500">Unduh saldo stok dari seluruh gudang sebagai CSV.</p>
          </div>
          <CardBody className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              File: <code className="rounded bg-slate-100 px-1 py-0.5">stok-{new Date().toISOString().slice(0, 10)}.csv</code>
            </p>
            <a
              href={buildExportUrl()}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" /> Download CSV
            </a>
          </CardBody>
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Upload className="h-4 w-4 text-emerald-700" /> Import Stok
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Saldo akan <strong>ditimpa</strong> sesuai nilai pada kolom <code className="rounded bg-slate-100 px-1">qty</code>.
            </p>
          </div>
          <CardBody>
            <form action={onImportSubmit} className="space-y-3">
              <input
                type="file"
                name="file"
                accept=".csv,text/csv"
                required
                className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white file:hover:bg-emerald-700"
              />
              <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
                <Upload className="h-4 w-4" />
                {isPending ? 'Memproses…' : 'Mulai Import'}
              </Button>
            </form>

            {result && (
              <div className={`mt-4 rounded-md border p-3 text-sm ${result.ok ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                <div className="flex items-center gap-2 font-medium">
                  {result.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : <AlertTriangle className="h-4 w-4 text-amber-700" />}
                  {result.ok ? 'Import berhasil' : 'Import selesai dengan peringatan'}
                </div>
                <ul className="mt-2 space-y-0.5 text-xs text-slate-700">
                  <li>✓ Dibuat: <strong>{result.created}</strong></li>
                  <li>✎ Diupdate: <strong>{result.updated}</strong></li>
                  <li>↷ Dilewati: <strong>{result.skipped}</strong></li>
                </ul>
                {result.errors.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-rose-700">
                      {result.errors.length} baris error — klik untuk lihat
                    </summary>
                    <ul className="mt-2 max-h-40 overflow-y-auto rounded border border-rose-200 bg-white p-2 text-xs text-rose-700">
                      {result.errors.map((e, i) => (
                        <li key={i}>Baris {e.row}: {e.message}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
