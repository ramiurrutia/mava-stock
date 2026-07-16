"use client";

import { useMemo } from "react";
import type { PriceOptionId, Product, SelectedPriceIds } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";

type ProductGridProps = {
  products: Product[];
  selectedIds: string[];
  selectedPriceIds: SelectedPriceIds;
  onToggle: (id: string) => void;
  onPriceToggle: (id: string, priceId: PriceOptionId) => void;
};

export function ProductGrid({
  products,
  selectedIds,
  selectedPriceIds,
  onToggle,
  onPriceToggle,
}: ProductGridProps) {
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  if (products.length === 0) {
    return (
      <section className="border border-dashed border-neutral-300 bg-white px-5 py-10 text-center">
        <p className="text-sm font-medium text-neutral-600">
          No encontramos cuadros con esos filtros.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Cuadros disponibles"
      className="grid grid-flow-dense grid-cols-2 items-stretch gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          selected={selectedSet.has(product.id)}
          selectedPriceId={selectedPriceIds[product.id]}
          onToggle={() => onToggle(product.id)}
          onPriceToggle={(priceId) => onPriceToggle(product.id, priceId)}
        />
      ))}
    </section>
  );
}
