'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/cn';

type Theme = 'light' | 'dark' | 'system';

function applyTheme(t: Theme) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = t === 'dark' || (t === 'system' && mq.matches);
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.dataset.theme = t;
  localStorage.setItem('theme', t);
}

export function ThemeToggle({ labels }: { labels: { light: string; dark: string; system: string } }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as Theme | null) ?? 'system';
    setTheme(saved);
    // Re-apply jika user pakai "system" lalu OS theme berubah
    if (saved === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, []);

  function setAndApply(t: Theme) {
    setTheme(t);
    applyTheme(t);
  }

  const opts: { key: Theme; icon: React.ReactNode; label: string }[] = [
    { key: 'light',  icon: <Sun     className="h-4 w-4" />, label: labels.light  },
    { key: 'dark',   icon: <Moon    className="h-4 w-4" />, label: labels.dark   },
    { key: 'system', icon: <Monitor className="h-4 w-4" />, label: labels.system },
  ];

  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex items-center gap-0.5 rounded-md border border-slate-300 bg-white p-0.5 dark:border-neutral-800 dark:bg-neutral-800"
    >
      {opts.map((o) => {
        const active = theme === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => setAndApply(o.key)}
            title={o.label}
            aria-pressed={active}
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded transition',
              active
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100',
            )}
          >
            {o.icon}
            <span className="sr-only">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
