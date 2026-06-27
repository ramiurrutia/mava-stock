"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductGrid } from "@/components/ProductGrid";
import { SelectedBar } from "@/components/SelectedBar";
import {
  applyLocalStock,
  useAdminMode,
  useLocalStock,
} from "@/components/useAdminStock";
import {
  getProductDefaultPriceId,
  productFolders,
  products,
  type PriceOptionId,
  type SelectedPriceIds,
} from "@/data/products";

const allFolders = "todas";

export default function Home() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [folder, setFolder] = useState(allFolders);
  const [selectedPriceIds, setSelectedPriceIds] = useState<SelectedPriceIds>({});
  const { isAdmin } = useAdminMode();
  const { unavailableProductIds } = useLocalStock();

  const activeFolder = productFolders.find((item) => item.id === folder);
  const productsWithLocalStock = applyLocalStock(products, unavailableProductIds);

  const filteredProducts = productsWithLocalStock.filter((product) => {
    const matchesFolder = folder === allFolders || product.folderId === folder;

    return matchesFolder;
  });

  function toggleProduct(id: string) {
    const product = productsWithLocalStock.find((item) => item.id === id);

    if (!product?.available) {
      return;
    }

    const isSelected = selectedIds.includes(id);

    setSelectedIds(
      isSelected
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id],
    );

    if (isSelected) {
      setSelectedPriceIds((current) => {
        const next = { ...current };
        delete next[id];

        return next;
      });
    } else {
      const defaultPriceId = getProductDefaultPriceId(product);

      setSelectedPriceIds((current) => ({
        ...current,
        [id]: defaultPriceId,
      }));
    }
  }

  function toggleProductPrice(id: string, priceId: PriceOptionId) {
    const product = productsWithLocalStock.find((item) => item.id === id);

    if (!product?.available) {
      return;
    }

    setSelectedIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
    setSelectedPriceIds((current) => {
      if (current[id] === priceId) {
        const next = { ...current };
        delete next[id];

        return next;
      }

      return {
        ...current,
        [id]: priceId,
      };
    });
  }

  function clearFilters() {
    setFolder(allFolders);
  }

  function selectFolder(nextFolder: string) {
    setFolder(nextFolder);
  }

  const hasFilters = folder !== allFolders;

  return (
    <main className="min-h-screen bg-[#f6f5f2] text-neutral-950">
      <div className="mx-auto w-full max-w-7xl px-2.5 pb-24 pt-3 sm:px-4 lg:px-6">
        <header className="mb-4 border-b border-neutral-300 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-neutral-500">
                Catalogo mayorista
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                MAVA CUADROS
              </h1>
              <p className="mt-3 text-base font-semibold text-[#1f6f65]">
                Clickeá las imagenes para realizar tu pedido
              </p>
            </div>

            {isAdmin ? (
              <div className="hidden gap-2 sm:flex">
                <Link
                  href="/admin"
                  className="border border-[#1f6f65] bg-[#1f6f65] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#185950]"
                >
                  Panel admin
                </Link>
                <Link
                  href="/stock"
                  target="_blank"
                  className="border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
                >
                  Imprimir stock
                </Link>
              </div>
            ) : null}
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase text-neutral-500">
                Carpetas por medidas
              </p>
              {activeFolder ? (
                <p className="hidden text-xs text-neutral-500 sm:block">
                  {activeFolder.description}
                </p>
              ) : null}
            </div>

            <div
              role="group"
              aria-label="Filtrar por carpeta de medidas"
              className="grid grid-cols-5 gap-1.5"
            >
              <button
                type="button"
                onClick={() => selectFolder(allFolders)}
                className={`min-h-16 border px-3 py-2 text-left transition ${
                  folder === allFolders
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-300 bg-white text-neutral-950 hover:border-neutral-950"
                }`}
              >
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-current opacity-65 sm:text-[11px]">
                  Todas
                </span>
                <span
                  className={`mt-1 block text-xs font-semibold ${
                    folder === allFolders ? "text-neutral-200" : "text-neutral-500"
                  }`}
                >
                  Todo el catalogo
                </span>
              </button>

              {productFolders.map((item) => {
                const active = folder === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectFolder(item.id)}
                  className={`min-h-14 border px-2 py-2 text-left transition sm:min-h-16 sm:px-3 ${
                      active
                        ? "border-neutral-950 bg-neutral-950 text-white"
                        : "border-neutral-300 bg-white text-neutral-950 hover:border-neutral-950"
                    }`}
                  >
                    <span
                      className={`block text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] ${
                        active ? "text-neutral-300" : "text-neutral-400"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      {item.measures.map((measureOption) => (
                        <span
                          key={measureOption.code}
                          className={`inline-flex border px-1 py-0.5 text-[9px] font-semibold leading-none sm:px-1.5 sm:text-[10px] ${
                            active
                              ? "border-white/30 bg-white/10 text-white"
                              : "border-neutral-300 bg-neutral-50 text-neutral-700"
                          }`}
                        >
                          {measureOption.label} {measureOption.size}
                        </span>
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm text-neutral-500">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1
              ? "cuadro encontrado"
              : "cuadros encontrados"}
            {selectedIds.length > 0 ? ` / ${selectedIds.length} elegidos` : ""}
          </p>

          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-semibold text-neutral-500 underline-offset-4 transition hover:text-neutral-950 hover:underline"
            >
              Ver todos
            </button>
          ) : null}
        </div>

        {filteredProducts.length > 0 ? (
          <ProductGrid
            products={filteredProducts}
            selectedIds={selectedIds}
            selectedPriceIds={selectedPriceIds}
            onToggle={toggleProduct}
            onPriceToggle={toggleProductPrice}
          />
        ) : (
          <section className="border border-dashed border-neutral-300 bg-white px-5 py-10 text-center">
            <h2 className="text-lg font-semibold">
              No hay cuadros en esta carpeta
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-neutral-500">
              Proba con otra carpeta de medidas.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-6 bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Ver todo el stock
            </button>
          </section>
        )}

        {isAdmin ? (
          <div className="mt-6 flex justify-center gap-4 sm:hidden">
            <Link
              href="/admin"
              className="text-sm font-semibold text-[#185950] underline-offset-4 transition hover:underline"
            >
              Panel admin
            </Link>
            <Link
              href="/stock"
              target="_blank"
              className="text-sm font-medium text-neutral-500 underline-offset-4 transition hover:text-neutral-950 hover:underline"
            >
              Imprimir todo el stock
            </Link>
          </div>
        ) : null}
        <SelectedBar
          selectedIds={selectedIds}
          selectedPriceIds={selectedPriceIds}
          onClear={() => {
            setSelectedIds([]);
            setSelectedPriceIds({});
          }}
        />
      </div>
    </main>
  );
}
