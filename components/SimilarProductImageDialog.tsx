"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import type { Product } from "@/data/products";

type SimilarProductImageDialogProps = {
  file: File;
  matches: Product[];
  failed: number;
  onCancel: () => void;
  onConfirm: () => void;
};

function ExistingImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);

  return failed ? (
    <p role="alert" className="p-4 text-center text-sm text-red-700">
      No se pudo mostrar {product.code}. Cancela para volver a intentar la revision.
    </p>
  ) : (
    <Image
      src={product.image.src}
      alt={`Cuadro existente ${product.code}`}
      fill
      unoptimized
      crossOrigin="anonymous"
      sizes="(max-width: 640px) 45vw, 400px"
      className="object-contain p-2"
      onError={() => setFailed(true)}
    />
  );
}

export function SimilarProductImageDialog({
  file,
  matches,
  failed,
  onCancel,
  onConfirm,
}: SimilarProductImageDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const uploadRef = useRef<HTMLImageElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = matches[selectedIndex];

  useEffect(() => {
    const dialog = dialogRef.current;
    const preview = uploadRef.current;
    const url = URL.createObjectURL(file);
    const previousOverflow = document.body.style.overflow;
    if (preview) preview.src = url;
    dialog?.showModal();
    cancelRef.current?.focus({ preventScroll: true });
    document.body.style.overflow = "hidden";

    return () => {
      dialog?.close();
      preview?.removeAttribute("src");
      URL.revokeObjectURL(url);
      document.body.style.overflow = previousOverflow;
    };
  }, [file]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="similar-image-title"
      aria-describedby="similar-image-description"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="image-comparison-dialog fixed inset-0 m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-4xl overflow-y-auto rounded-lg border border-neutral-200 bg-white p-3 text-neutral-950 shadow-2xl backdrop:bg-neutral-950/70 sm:p-5"
    >
      <h2 id="similar-image-title" className="text-lg font-semibold sm:text-xl">
        {matches.length ? "Encontramos imagenes similares" : "Revision incompleta"}
      </h2>
      <p id="similar-image-description" className="mt-1 text-sm text-neutral-600">
        {matches.length
          ? "Compara tu imagen con los cuadros del catalogo. Queres subirla igualmente?"
          : "No se pudo completar la comparacion con el catalogo. Queres subirla igualmente?"}
      </p>

      <div className={`mt-4 grid gap-3 ${selected ? "grid-cols-2" : "grid-cols-1"}`}>
        <figure className="image-comparison-upload min-w-0">
          <figcaption className="mb-2 text-sm font-semibold">Tu imagen</figcaption>
          <div className="relative flex h-[min(42dvh,24rem)] items-center justify-center border border-neutral-200 bg-neutral-50">
            {/* Blob previews use a native image so its URL can be released on close. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={uploadRef} alt="Imagen que vas a subir" className="h-full w-full object-contain p-2" />
          </div>
          <p className="mt-2 break-all text-xs text-neutral-500">{file.name}</p>
        </figure>
        {selected ? (
          <figure className="min-w-0">
            <figcaption className="mb-2 text-sm font-semibold">Ya en el catalogo</figcaption>
            <div key={selected.code} className="image-comparison-match relative flex h-[min(42dvh,24rem)] items-center justify-center border border-neutral-200 bg-neutral-50">
              <ExistingImage key={selected.image.src} product={selected} />
            </div>
            <div className="mt-2 flex min-h-10 flex-wrap items-center justify-between gap-2">
              <p className="break-all text-sm font-semibold">{selected.code}</p>
              {matches.length > 1 ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={selectedIndex === 0}
                    onClick={() => setSelectedIndex((index) => index - 1)}
                    aria-label="Coincidencia anterior"
                    title="Coincidencia anterior"
                    className="flex h-10 w-10 items-center justify-center rounded border border-neutral-300 hover:bg-neutral-100 disabled:opacity-30"
                  ><BsChevronLeft aria-hidden="true" /></button>
                  <span aria-live="polite" className="min-w-10 text-center text-xs text-neutral-600">{selectedIndex + 1}/{matches.length}</span>
                  <button
                    type="button"
                    disabled={selectedIndex === matches.length - 1}
                    onClick={() => setSelectedIndex((index) => index + 1)}
                    aria-label="Siguiente coincidencia"
                    title="Siguiente coincidencia"
                    className="flex h-10 w-10 items-center justify-center rounded border border-neutral-300 hover:bg-neutral-100 disabled:opacity-30"
                  ><BsChevronRight aria-hidden="true" /></button>
                </div>
              ) : null}
            </div>
          </figure>
        ) : null}
      </div>

      {failed > 0 ? (
        <p className="mt-3 text-sm text-amber-800">No se pudieron revisar {failed} imagenes del catalogo.</p>
      ) : null}
      <div className="mt-4 flex flex-col-reverse gap-2 border-t border-neutral-200 pt-4 sm:flex-row sm:justify-end">
        <button
          ref={cancelRef}
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded border border-neutral-300 bg-white px-4 text-sm font-semibold hover:bg-neutral-100"
        >Cancelar</button>
        <button
          type="button"
          onClick={onConfirm}
          className="min-h-11 rounded bg-[#7E5E35] px-4 text-sm font-semibold text-white hover:bg-[#654b2a]"
        >Subir igualmente</button>
      </div>
    </dialog>
  );
}
