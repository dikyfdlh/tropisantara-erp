'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

/**
 * Tombol hapus dengan konfirmasi browser. Memicu server action saat user mengkonfirmasi.
 */
export function ConfirmDeleteButton({
  action, label = 'Hapus', confirmText, size = 'sm', variant = 'danger', iconOnly = false,
}: {
  action: () => Promise<void>;
  label?: string;
  confirmText: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'danger' | 'outline' | 'ghost';
  iconOnly?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  function confirmAndSubmit() {
    if (window.confirm(confirmText)) formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={action}>
      <Button type="button" size={size} variant={variant} onClick={confirmAndSubmit}>
        <Trash2 className={iconOnly ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
        {!iconOnly && <span>{label}</span>}
      </Button>
    </form>
  );
}
