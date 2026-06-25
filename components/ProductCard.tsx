"use client";

import type { KeyboardEvent } from "react";
import { priceOptions, type Product } from "@/data/products";
import { FramePreview } from "@/components/FramePreview";

type ProductCardProps = {
  product: Product;
  selected: boolean;
  onToggle: () => void;
};

export function ProductCard({ product, selected, onToggle }: ProductCardProps) {
  const isUnavailable = !product.available;

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (isUnavailable) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle();
    }
  }

  return (
    <article
      role={isUnavailable ? undefined : "button"}
      tabIndex={isUnavailable ? undefined : 0}
      aria-pressed={isUnavailable ? undefined : selected}
      aria-disabled={isUnavailable ? true : undefined}
      onClick={isUnavailable ? undefined : onToggle}
      onKeyDown={handleKeyDown}
      className={`group border transition ${
        selected
          ? "border-[#1f6f65] bg-[#1f6f65]/10 shadow-sm"
          : "border-neutral-200 bg-white hover:border-neutral-400"
      } ${
        isUnavailable
          ? "cursor-not-allowed opacity-45 grayscale"
          : "cursor-pointer"
      }`}
    >
      <div className="relative isolate bg-[#efede8] p-2">
        <FramePreview product={product} />

        {selected ? (
          <div className="pointer-events-none absolute inset-0 z-20 bg-[#1f6f65]/10" />
        ) : null}

        {isUnavailable ? (
          <span className="absolute left-3 top-3 z-30 bg-neutral-950 px-2 py-1 text-[11px] font-semibold text-white">
            Sin stock
          </span>
        ) : null}

        {selected ? (
          <span className="absolute left-3 top-3 z-30 bg-[#1f6f65] px-2 py-1 text-[11px] font-semibold text-white">
            Seleccionado
          </span>
        ) : null}
      </div>

      <div className="p-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-neutral-500">
            {product.code}
          </p>
          <h2 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">
            {product.name}
          </h2>
        </div>

        <div className="mt-3 space-y-1 border-t border-neutral-100 pt-3 text-xs">
          <p className="leading-tight text-neutral-500">{product.size}</p>
          <p className="text-neutral-500">{product.category}</p>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
          {priceOptions.map((option) => (
            <div key={option.label} className="border border-neutral-200 bg-white/70 p-2">
              <p className="truncate text-neutral-500">{option.shortLabel}</p>
              <p className="mt-0.5 font-semibold text-neutral-950">
                {option.price}
              </p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
