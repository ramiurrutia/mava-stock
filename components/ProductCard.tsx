"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { BsCheckLg, BsStarFill } from "react-icons/bs";
import {
  getProductPreviewDimensions,
  getProductPriceOptions,
  isProductLandscape,
  type PriceOptionId,
  type Product,
} from "@/data/products";
import { FramePreview } from "@/components/FramePreview";

type ProductCardProps = {
  bestSeller: boolean;
  product: Product;
  selected: boolean;
  selectedPriceId?: PriceOptionId;
  onToggle: () => void;
  onPriceToggle: (priceId: PriceOptionId) => void;
};

export function ProductCard({
  bestSeller,
  product,
  selected,
  selectedPriceId,
  onToggle,
  onPriceToggle,
}: ProductCardProps) {
  const [failedArtworkSrc, setFailedArtworkSrc] = useState("");
  const isUnavailable = !product.available;
  const isLandscape = isProductLandscape(product);
  const previewDimensions = getProductPreviewDimensions(product);
  const previewLongSide = Math.max(
    previewDimensions.width,
    previewDimensions.height,
  );
  const previewScale = 340 / previewLongSide;
  const previewWidth = previewDimensions.width * previewScale;
  const previewStyle: CSSProperties = {
    maxWidth: `${previewWidth}px`,
  };
  const priceOptions = getProductPriceOptions(product);
  const artworkFailed = failedArtworkSrc === product.image.src;
  let priceGridClass = "grid-cols-2";

  if (artworkFailed) {
    return null;
  }

  if (priceOptions.length === 1) {
    priceGridClass = "grid-cols-1";

    if (isLandscape) {
      priceGridClass = "sm:grid-cols-[minmax(8rem,12rem)]";
    }
  }

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden border transition ${
        isLandscape ? "col-span-2" : ""
      } ${
        selected
          ? "border-[#7E5E35] shadow-sm"
          : bestSeller
            ? "border-[#D0AE72] bg-[#fffaf0] shadow-[0_10px_26px_rgba(154,109,50,0.2)] hover:border-[#B98735]"
            : "border-neutral-200 shadow-none hover:border-neutral-400"
      } ${
        selected
          ? "bg-[#7E5E35]/10"
          : bestSeller
            ? "bg-[#fffaf0]"
            : "bg-white"
      } ${
        isUnavailable
          ? "cursor-not-allowed opacity-45 grayscale"
          : "cursor-pointer"
      }`}
    >
      {bestSeller ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-40 h-1 bg-[#C28B32]"
        />
      ) : null}
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
          <div className="mx-auto w-full" style={previewStyle}>
            <FramePreview
              product={product}
              selectedPriceId={selectedPriceId}
              onArtworkError={() => setFailedArtworkSrc(product.image.src)}
            />
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
            <span
              title="Seleccionado"
              aria-label="Seleccionado"
              className="absolute left-2.5 top-2.5 z-30 grid h-8 w-8 place-items-center rounded-full bg-white text-[#7E5E35] shadow-md"
            >
              <BsCheckLg aria-hidden="true" className="h-5 w-5" />
            </span>
          ) : null}

          {bestSeller ? (
            <span className="absolute bottom-2.5 right-2.5 z-30 inline-flex items-center gap-1.5 bg-[#9A6D32] px-2 py-1 text-[10px] font-semibold uppercase text-white shadow-md">
              <BsStarFill aria-hidden="true" />
              Lo mas vendido
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
