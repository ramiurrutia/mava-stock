"use client";

import {
  getProductPriceOptions,
  isProductLandscape,
  type PriceOptionId,
  type Product,
} from "@/data/products";
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
  const isLandscape = isProductLandscape(product);
  const priceOptions = getProductPriceOptions(product);
  const pairText = product.pairRelatedCodes?.length
    ? `Hace pareja con ${product.pairRelatedCodes.join(", ")}`
    : product.pairLabel;
  let priceGridClass = "grid-cols-2";

  if (priceOptions.length === 1) {
    priceGridClass = "grid-cols-1";

    if (isLandscape) {
      priceGridClass = "sm:grid-cols-[minmax(8rem,12rem)]";
    }
  }

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden border transition ${
        isLandscape ? "col-span-2" : ""
      } ${
        selected
          ? "border-[#7E5E35] bg-[#7E5E35]/10 shadow-sm"
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
        <div
          className={`relative isolate bg-[#ece8df] ${
            isLandscape ? "p-2 sm:px-6 sm:py-3" : "p-1.5"
          }`}
        >
          <div className={isLandscape ? "mx-auto w-full max-w-[86%]" : ""}>
            <FramePreview product={product} selectedPriceId={selectedPriceId} />
          </div>

          {selected ? (
            <div className="pointer-events-none absolute inset-0" />
          ) : null}

          {isUnavailable ? (
            <span className="absolute left-2.5 top-2.5 z-30 bg-neutral-950/85 px-2 py-1 text-[10px] font-semibold uppercase text-white">
              Sin stock
            </span>
          ) : null}

          {selected ? (
            <span className="absolute left-2.5 top-2.5 z-30 bg-[#7E5E35] px-2 py-1 text-[10px] font-semibold uppercase text-white">
              Seleccionado
            </span>
          ) : null}

          {product.pairGroupId ? (
            <span className="absolute right-2.5 top-2.5 z-30 border border-[#7E5E35]/30 bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase text-[#7E5E35]">
              Pareja {product.pairPosition}/{product.pairSize}
            </span>
          ) : null}
        </div>

        <div
          className={`p-2.5 pb-0 ${
            isLandscape
              ? "sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4"
              : ""
          }`}
        >
          <div className="min-w-0">
            <h2 className="truncate font-mono text-[13px] font-semibold uppercase leading-snug text-neutral-950">
              {product.code}
            </h2>
            {pairText ? (
              <p className="mt-1 truncate text-[11px] font-semibold text-[#7E5E35]">
                {pairText}
              </p>
            ) : null}
          </div>

          <p
            className={`mt-2 border-t border-neutral-200 pt-2 text-[11px] leading-tight text-neutral-500 ${
              isLandscape ? "sm:mt-0 sm:border-t-0 sm:pt-0 sm:text-right" : ""
            }`}
          >
            {product.size}
          </p>
        </div>
      </button>

      <div className="mt-auto p-2.5 pt-2">
        <div className={`grid gap-1.5 text-[11px] ${priceGridClass}`}>
          {priceOptions.map((option) => {
            const active = selectedPriceId === option.id;

            return (
              <button
                key={option.id}
                type="button"
                disabled={isUnavailable}
                aria-pressed={active}
                onClick={() => onPriceToggle(option.id)}
                className={`border px-2 py-1.5 text-left transition disabled:cursor-not-allowed ${
                  active
                    ? "border-[#7E5E35] bg-[#7E5E35] text-white"
                    : "border-neutral-200 bg-neutral-50 text-neutral-950 hover:border-[#7E5E35] hover:bg-white"
                }`}
              >
                <span
                  className={`block truncate text-[10px] ${
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
      </div>
    </article>
  );
}
