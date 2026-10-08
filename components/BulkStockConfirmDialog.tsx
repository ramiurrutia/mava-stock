"use client";

import { useEffect, useRef, useState } from "react";
import { BsExclamationTriangle } from "react-icons/bs";

type BulkStockConfirmDialogProps = {
  count: number;
  label: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

export function BulkStockConfirmDialog({
  count,
  label,
  onCancel,
  onConfirm,
}: BulkStockConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const submittingRef = useRef(false);
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const confirmed = confirmation.trim().toUpperCase() === "SIN STOCK";

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    cancelRef.current?.focus({ preventScroll: true });
    document.body.style.overflow = "hidden";

    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmed || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      await onConfirm();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar el stock.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="bulk-stock-title"
      aria-describedby="bulk-stock-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!submittingRef.current) onCancel();
      }}
      className="bulk-stock-dialog fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg border border-red-200 bg-white p-5 text-neutral-950 shadow-2xl backdrop:bg-neutral-950/65 sm:p-6"
    >
      <form onSubmit={handleSubmit} aria-busy={submitting}>
        <div className="flex items-center gap-3">
          <BsExclamationTriangle aria-hidden="true" className="h-7 w-7 shrink-0 text-red-700" />
          <h2 id="bulk-stock-title" className="text-lg font-semibold">Confirmar baja de stock</h2>
        </div>
        <div id="bulk-stock-description" className="mt-4 space-y-2 text-sm leading-6">
          <p>Vas a poner <strong>{count} cuadros sin stock</strong> de <strong className="break-words">{label}</strong>.</p>
          <p className="text-neutral-600">Sus cantidades quedarán en cero y dejarán de aparecer en los catálogos mayorista y minorista.</p>
        </div>
        <label className="mt-5 block text-sm font-medium" htmlFor="bulk-stock-confirmation">
          Escribí <strong>SIN STOCK</strong> para confirmar
        </label>
        <input
          id="bulk-stock-confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          disabled={submitting}
          autoComplete="off"
          spellCheck={false}
          className="mt-2 h-11 w-full rounded border border-neutral-300 bg-white px-3 text-base focus:border-red-700 disabled:bg-neutral-100"
        />
        {error ? <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="h-11 rounded border border-neutral-300 bg-white px-4 text-sm font-semibold hover:bg-neutral-100 disabled:opacity-50"
          >Cancelar</button>
          <button
            type="submit"
            disabled={!confirmed || submitting}
            className="h-11 rounded bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
          >{submitting ? "Actualizando..." : "Confirmar sin stock"}</button>
        </div>
      </form>
    </dialog>
  );
}
