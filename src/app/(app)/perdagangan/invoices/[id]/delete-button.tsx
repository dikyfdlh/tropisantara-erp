'use client';

import { ConfirmDeleteButton } from '@/components/ui/confirm-delete';

/**
 * Shim — gunakan ConfirmDeleteButton secara langsung untuk pemanggilan baru.
 * Dipertahankan demi backward-compat dengan kode lama yang mengoper `code`.
 */
export function DeleteInvoiceButton({
  action, code,
}: { action: () => Promise<void>; code: string }) {
  return (
    <ConfirmDeleteButton
      action={action}
      confirmText={`Yakin hapus invoice ${code}? Pembayaran terkait juga ikut terhapus.`}
    />
  );
}
