'use client';

import { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';

export function PasswordReveal({ value }: { value: string }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!value) {
    return <span className="text-xs text-slate-400">— tidak tersedia —</span>;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {/* ignore */}
  }

  return (
    <div className="flex items-center gap-2">
      <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs">
        {shown ? value : '••••••••'}
      </code>
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        title={shown ? 'Sembunyikan' : 'Tampilkan'}
      >
        {shown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        onClick={copy}
        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        title="Salin"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
