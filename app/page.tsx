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
  categories,
  finishOptions,
  productFolders,
  products,
  type PriceOptionId,
  type SelectedPriceIds,
} from "@/data/products";

const allFolders = "todas";
const allMeasures = "todas";
const allFinishes = "todos";
const defaultPriceId: PriceOptionId = "blanco";

export default function Home() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [folder, setFolder] = useState(allFolders);
  const [measure, setMeasure] = useState(allMeasures);
  const [finish, setFinish] = useState(allFinishes);
  const [selectedPriceIds, setSelectedPriceIds] = useState<SelectedPriceIds>({});
  const { isAdmin } = useAdminMode();
  const { unavailableProductIds } = useLocalStock();

  const activeFolder = productFolders.find((item) => item.id === folder);
  const productsWithLocalStock = applyLocalStock(products, unavailableProductIds);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredProducts = productsWithLocalStock.filter((product) => {
    const matchesCategory =
      category === "Todas" || product.category === category;
    const matchesFolder = folder === allFolders || product.folderId === folder;
    const matchesMeasure =
      measure === allMeasures || product.measureCode === measure;
    const matchesFinish = finish === allFinishes || product.finish === finish;
    const matchesSearch =
      normalizedSearch.length === 0 ||
      product.code.toLowerCase().includes(normalizedSearch) ||
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.category.toLowerCase().includes(normalizedSearch) ||
      product.size.toLowerCase().includes(normalizedSearch);

    return (
      matchesCategory &&
      matchesFolder &&
      matchesMeasure &&
      matchesFinish &&
      matchesSearch
    );
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
    setSearch("");
    setCategory("Todas");
    setFolder(allFolders);
    setMeasure(allMeasures);
    setFinish(allFinishes);
  }

  function selectFolder(nextFolder: string) {
    setFolder(nextFolder);
    setMeasure(allMeasures);
    setFinish(allFinishes);
  }

  const hasFilters =
    Boolean(search) ||
    category !== "Todas" ||
    folder !== allFolders ||
    measure !== allMeasures ||
    finish !== allFinishes;

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

          <div className="mt-5 grid gap-3 lg:grid-cols-[360px_1fr] lg:items-start">
            <div className="relative">
              <label htmlFor="search" className="sr-only">
                Buscar cuadro
              </label>
              <input
                id="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar codigo, nombre, medida o tema"
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

          <div className="mt-5">
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
              className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
            >
              <button
                type="button"
                onClick={() => selectFolder(allFolders)}
                className={`border p-3 text-left transition ${
                  folder === allFolders
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-300 bg-white text-neutral-950 hover:border-neutral-950"
                }`}
              >
                <span className="block text-sm font-semibold">Todas</span>
                <span
                  className={`mt-1 block text-xs ${
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
                    className={`border p-3 text-left transition ${
                      active
                        ? "border-neutral-950 bg-neutral-950 text-white"
                        : "border-neutral-300 bg-white text-neutral-950 hover:border-neutral-950"
                    }`}
                  >
                    <span className="block text-sm font-semibold">
                      {item.label}
                    </span>
                    <span
                      className={`mt-1 block text-xs ${
                        active ? "text-neutral-200" : "text-neutral-500"
                      }`}
                    >
                      {item.measures
                        .map((measureOption) =>
                          `${measureOption.code} ${measureOption.size}`,
                        )
                        .join(" / ")}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeFolder ? (
              <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-neutral-500">
                    Medida
                  </p>
                  <div
                    role="group"
                    aria-label="Filtrar por medida"
                    className="flex gap-2 overflow-x-auto pb-1"
                  >
                    <button
                      type="button"
                      onClick={() => setMeasure(allMeasures)}
                      className={`h-10 shrink-0 border px-4 text-sm font-semibold transition ${
                        measure === allMeasures
                          ? "border-[#1f6f65] bg-[#1f6f65] text-white"
                          : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-950 hover:text-neutral-950"
                      }`}
                    >
                      Todas
                    </button>
                    {activeFolder.measures.map((item) => {
                      const active = measure === item.code;

                      return (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => setMeasure(item.code)}
                          className={`h-10 shrink-0 border px-4 text-sm font-semibold transition ${
                            active
                              ? "border-[#1f6f65] bg-[#1f6f65] text-white"
                              : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-950 hover:text-neutral-950"
                          }`}
                        >
                          {item.code} {item.size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-neutral-500">
                    Tipo
                  </p>
                  <div
                    role="group"
                    aria-label="Filtrar por tipo"
                    className="flex gap-2 overflow-x-auto pb-1"
                  >
                    <button
                      type="button"
                      onClick={() => setFinish(allFinishes)}
                      className={`h-10 shrink-0 border px-4 text-sm font-semibold transition ${
                        finish === allFinishes
                          ? "border-[#1f6f65] bg-[#1f6f65] text-white"
                          : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-950 hover:text-neutral-950"
                      }`}
                    >
                      Todos
                    </button>
                    {finishOptions.map((item) => {
                      const active = finish === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFinish(item.id)}
                          className={`h-10 shrink-0 border px-4 text-sm font-semibold transition ${
                            active
                              ? "border-[#1f6f65] bg-[#1f6f65] text-white"
                              : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-950 hover:text-neutral-950"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
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
            selectedPriceIds={selectedPriceIds}
            onToggle={toggleProduct}
            onPriceToggle={toggleProductPrice}
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

        {isAdmin ? (
          <div className="mt-8 flex justify-center gap-4 sm:hidden">
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
