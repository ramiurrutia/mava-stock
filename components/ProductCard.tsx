"use client";

import { priceOptions, type PriceOptionId, type Product } from "@/data/products";
import { FramePreview } from "@/components/FramePreview";

type ProductCardProps = {
  product: Product;
  selected: boolean;
  selectedPriceId?: PriceOptionId;
  onToggle: () => void;
  onPriceToggle: (priceId: PriceOptionId) => void;
};

export function ProductCard({
  product,
  selected,
  selectedPriceId,
  onToggle,
  onPriceToggle,
}: ProductCardProps) {
  const isUnavailable = !product.available;

  return (
    <article
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
      <button
        type="button"
        disabled={isUnavailable}
        aria-pressed={selected}
        onClick={onToggle}
        className="block w-full text-left disabled:cursor-not-allowed"
      >
        <div className="relative isolate bg-[#efede8] p-2">
          <FramePreview product={product} selectedPriceId={selectedPriceId} />

          {selected ? (
            <div className="pointer-events-none absolute inset-0" />
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

        <div className="p-3 pb-0">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-neutral-500">
              {product.code}
            </p>
            <h2 className="line-clamp-2 text-sm font-semibold leading-snug">
              {product.name}
            </h2>
          </div>

          <div className="mt-2 space-y-1 border-t border-neutral-300 pt-3 text-xs">
            <p className="leading-tight text-neutral-500">{product.size}</p>
            <p className="text-neutral-500">{product.category}</p>
          </div>
        </div>
      </button>

      <div className="p-3 pt-2">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {priceOptions.map((option) => {
            const active = selectedPriceId === option.id;

            return (
              <button
                key={option.id}
                type="button"
                disabled={isUnavailable}
                aria-pressed={active}
                onClick={() => onPriceToggle(option.id)}
                className={`border p-2 text-left transition disabled:cursor-not-allowed ${
                  active
                    ? "border-[#1f6f65] bg-[#1f6f65] text-white"
                    : "border-neutral-200 bg-white/70 text-neutral-950 hover:border-[#1f6f65]"
                }`}
              >
                <span
                  className={`block truncate ${
                    active ? "text-white/80" : "text-neutral-500"
                  }`}
                >
                  {option.shortLabel}
                </span>
                <span className="mt-0.5 block font-semibold">
                  {option.price}
                </span>
              </button>
            );
          })}
        </div>
        {selected && !selectedPriceId && !isUnavailable ? (
          <p className="mt-2 text-[11px] font-medium text-neutral-500">
            Precio sin elegir
          </p>
        ) : null}
      </div>
    </article>
  );
}
