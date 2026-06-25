"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductGrid } from "@/components/ProductGrid";
import { SelectedBar } from "@/components/SelectedBar";
import { categories, products } from "@/data/products";

export default function Home() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === "Todas" || product.category === category;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.code.toLowerCase().includes(normalizedSearch) ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  function toggleProduct(id: string) {
    const product = products.find((item) => item.id === id);

    if (!product?.available) {
      return;
    }

    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  function clearFilters() {
    setSearch("");
    setCategory("Todas");
  }

  const hasFilters = Boolean(search) || category !== "Todas";

  return (
    <main className="min-h-screen bg-[#f6f5f2] text-neutral-950">
      <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <header className="mb-6 border-b border-neutral-300 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-neutral-500">
                Catalogo mayorista
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                MAVA CUADROS
              </h1>
            </div>

            <Link
              href="/stock"
              target="_blank"
              className="hidden border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950 sm:block"
            >
              Imprimir stock
            </Link>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[360px_1fr] lg:items-start">
            <div className="relative">
              <label htmlFor="search" className="sr-only">
                Buscar cuadro
              </label>
              <input
                id="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar codigo, nombre o tema"
                className="h-12 w-full border border-neutral-300 bg-white px-4 pr-10 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Borrar busqueda"
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center bg-neutral-100 text-sm font-semibold text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-900"
                >
                  x
                </button>
              ) : null}
            </div>

            <div
              role="group"
              aria-label="Filtrar por tematica"
              className="flex gap-2 overflow-x-auto pb-1"
            >
              {["Todas", ...categories].map((item) => {
                const active = category === item;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={`h-10 shrink-0 border px-4 text-sm font-semibold transition ${
                      active
                        ? "border-neutral-950 bg-neutral-950 text-white"
                        : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-950 hover:text-neutral-950"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <div className="mb-4 flex items-center justify-between gap-3">
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
            onToggle={toggleProduct}
          />
        ) : (
          <section className="border border-dashed border-neutral-300 bg-white px-6 py-14 text-center">
            <h2 className="text-lg font-semibold">
              No encontramos cuadros con esa busqueda
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-neutral-500">
              Proba con otro codigo, nombre o tematica.
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

        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            href="/stock"
            target="_blank"
            className="text-sm font-medium text-neutral-500 underline-offset-4 transition hover:text-neutral-950 hover:underline"
          >
            Imprimir todo el stock
          </Link>
        </div>
        <SelectedBar
          selectedIds={selectedIds}
          onClear={() => setSelectedIds([])}
        />
      </div>
    </main>
  );
}
