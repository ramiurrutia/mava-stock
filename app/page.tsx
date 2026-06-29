"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  type ProductFolderId,
  type SelectedPriceIds,
} from "@/data/products";

const folderUrlParam = "tamano";

function getCatalogUrl(folderId: ProductFolderId | null) {
  const url = new URL(window.location.href);

  if (folderId) {
    url.searchParams.set(folderUrlParam, folderId);
  } else {
    url.searchParams.delete(folderUrlParam);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

function getFolderIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const folderId = params.get(folderUrlParam);

  return productFolders.some((folder) => folder.id === folderId)
    ? (folderId as ProductFolderId)
    : null;
}

export default function Home() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedFolderId, setSelectedFolderId] =
    useState<ProductFolderId | null>(null);
  const [selectedPriceIds, setSelectedPriceIds] = useState<SelectedPriceIds>(
    {},
  );
  const [search, setSearch] = useState("");
  const { isAdmin } = useAdminMode();
  const { unavailableProductIds } = useLocalStock();

  const activeFolder = productFolders.find(
    (item) => item.id === selectedFolderId,
  );
  const productsWithLocalStock = applyLocalStock(
    products,
    unavailableProductIds,
  );
  const customerVisibleProducts = isAdmin
    ? productsWithLocalStock
    : productsWithLocalStock.filter((product) => product.available);
  const normalizedSearch = search.trim().toLowerCase();

  const filteredProducts = activeFolder
    ? customerVisibleProducts.filter((product) => {
        const matchesFolder = product.folderId === activeFolder.id;
        const matchesSearch =
          normalizedSearch.length === 0 ||
          product.name.toLowerCase().includes(normalizedSearch) ||
          product.category.toLowerCase().includes(normalizedSearch);

        return matchesFolder && matchesSearch;
      })
    : [];

  useEffect(() => {
    function syncFolderFromUrl() {
      setSelectedFolderId(getFolderIdFromUrl());
      setSearch("");
    }

    syncFolderFromUrl();
    window.addEventListener("popstate", syncFolderFromUrl);

    return () => {
      window.removeEventListener("popstate", syncFolderFromUrl);
    };
  }, []);

  function getFolderProductCount(folderId: ProductFolderId) {
    return customerVisibleProducts.filter(
      (product) => product.folderId === folderId,
    ).length;
  }

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

    const shouldDeselectProduct = selectedPriceIds[id] === priceId;

    setSelectedIds((current) =>
      shouldDeselectProduct
        ? current.filter((selectedId) => selectedId !== id)
        : current.includes(id)
          ? current
          : [...current, id],
    );
    setSelectedPriceIds((current) => {
      if (shouldDeselectProduct) {
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

  function selectFolder(folderId: ProductFolderId) {
    setSelectedFolderId(folderId);
    setSearch("");
    window.history.pushState(null, "", getCatalogUrl(folderId));
  }

  function returnToSizes() {
    setSelectedFolderId(null);
    setSearch("");
    window.history.replaceState(null, "", getCatalogUrl(null));
  }

  return (
    <main className="min-h-screen bg-[#f6f5f2] text-neutral-950">
      <div className="mx-auto w-full max-w-7xl px-2.5 pb-24 pt-3 sm:px-4 lg:px-6">
        <header className="mb-4 border-b border-neutral-300 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                MAVA CUADROS
              </h1>
              <p className="text-base font-semibold text-[#1f6f65]">
                {activeFolder
                  ? "Clickea las imagenes para realizar tu pedido"
                  : "Elegi un tamaño para ver los cuadros disponibles"}
              </p>
            </div>

            {isAdmin ? (
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <Link
                  href="/admin"
                  className="border border-[#1f6f65] bg-[#1f6f65] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#185950] sm:px-4 sm:text-sm"
                >
                  Panel admin
                </Link>
                <Link
                  href="/stock"
                  target="_blank"
                  className="hidden border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950 sm:block"
                >
                  Imprimir stock
                </Link>
              </div>
            ) : null}
          </div>
        </header>

        {!activeFolder ? (
          <section
            key="size-menu"
            className="catalog-panel"
            aria-label="Elegir tamaño del cuadro"
          >
            <div
              role="group"
              aria-label="Tamaños disponibles"
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              {productFolders.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectFolder(item.id)}
                  className="group min-h-29 border border-neutral-300 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-neutral-950 hover:shadow-md"
                >
                  <span className="block text-lg font-semibold leading-tight">
                    {item.label}
                  </span>
                  <span className="block text-xs font-semibold text-neutral-500 transition group-hover:text-[#1f6f65]">
                    {getFolderProductCount(item.id)} cuadros disponibles
                  </span>
                  <span className="mt-4 flex flex-wrap gap-1.5">
                    {item.measures.map((measure) => (
                      <span
                        key={measure.code}
                        className="border border-neutral-200 bg-neutral-50 px-2 py-1 text-sm font-semibold text-neutral-700 transition group-hover:border-[#1f6f65]/40"
                      >
                        <span className="text-neutral-950">
                          {measure.label}
                        </span>{" "}
                        <span className="font-medium text-neutral-500">
                          {measure.size}
                        </span>
                      </span>
                    ))}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section
            key={activeFolder.id}
            className="catalog-panel"
            aria-label={`Cuadros ${activeFolder.label}`}
          >
            <div className="mb-4 grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
              <button
                type="button"
                onClick={returnToSizes}
                className="flex h-11 items-center justify-center border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:border-neutral-950 hover:text-neutral-950 sm:justify-start"
              >
                ← Volver a tamaños
              </button>
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
                  No hay cuadros para mostrar
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-neutral-500">
                  Proba limpiando la busqueda o volviendo a elegir otro tamaño.
                </p>
                {search.trim().length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-6 bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
                  >
                    Limpiar busqueda
                  </button>
                ) : null}
              </section>
            )}
          </section>
        )}

        {isAdmin ? (
          <div className="mt-6 flex justify-center gap-4 sm:hidden">
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
