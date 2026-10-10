import { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isPending?: boolean;
  tone?: 'danger' | 'warning';
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  isPending = false,
  tone = 'danger',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmationLock = useRef(false);
  const sawPending = useRef(false);
  const [isConfirmationLocked, setIsConfirmationLocked] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open) {
      if (dialog.open) dialog.close();
      confirmationLock.current = false;
      sawPending.current = false;
      setIsConfirmationLocked(false);
    }
  }, [open]);

  useEffect(() => {
    if (isPending) {
      sawPending.current = true;
    } else if (sawPending.current) {
      confirmationLock.current = false;
      sawPending.current = false;
      setIsConfirmationLocked(false);
    }
  }, [isPending]);

  const interactionLocked = isPending || isConfirmationLocked;

  const handleConfirm = () => {
    if (confirmationLock.current || isPending) return;

    confirmationLock.current = true;
    setIsConfirmationLocked(true);
    try {
      onConfirm();
    } catch (error) {
      confirmationLock.current = false;
      setIsConfirmationLocked(false);
      throw error;
    }
  };

  const danger = tone === 'danger';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!interactionLocked) onCancel();
      }}
      className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-3xl border border-white/10 bg-[#151515] p-0 text-white shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 sm:p-7">
        <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-full border ${danger ? 'border-rose-400/20 bg-rose-500/10 text-rose-300' : 'border-amber-400/20 bg-amber-500/10 text-amber-300'}`}>
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 id={titleId} className="text-xl font-bold tracking-tight">{title}</h2>
        <p id={descriptionId} className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={interactionLocked}
            autoFocus
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/5 disabled:opacity-50"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={interactionLocked}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50 ${danger ? 'bg-rose-600 hover:bg-rose-500' : 'bg-amber-600 hover:bg-amber-500'}`}
          >
            {interactionLocked ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
