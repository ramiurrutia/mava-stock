"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ProductGrid } from "@/components/ProductGrid";
import { SelectedBar } from "@/components/SelectedBar";
import { useCatalogProducts } from "@/components/useCatalogProducts";
import {
  applyLocalStock,
  useAdminMode,
  useLocalStock,
} from "@/components/useAdminStock";
import {
  getProductDefaultPriceId,
  orderProductsWithPairs,
  productFolders,
  type PriceOptionId,
  type ProductFolderId,
  type SelectedPriceIds,
} from "@/data/products";

const folderUrlParam = "tamano";
const catalogNoticeStorageKey = "mava-catalog-notice-hidden";
const catalogNoticeChangeEvent = "mava-catalog-notice-change";

function subscribeCatalogNotice(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", callback);
  window.addEventListener(catalogNoticeChangeEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(catalogNoticeChangeEvent, callback);
  };
}

function getCatalogNoticeSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(catalogNoticeStorageKey) !== "true";
}

function getCatalogNoticeServerSnapshot() {
  return false;
}

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
  const [dismissedCatalogNotice, setDismissedCatalogNotice] = useState(false);
  const shouldShowCatalogNotice = useSyncExternalStore(
    subscribeCatalogNotice,
    getCatalogNoticeSnapshot,
    getCatalogNoticeServerSnapshot,
  );
  const showCatalogNotice = shouldShowCatalogNotice && !dismissedCatalogNotice;
  const { isAdmin } = useAdminMode();
  const { unavailableProductIds } = useLocalStock();
  const catalogProducts = useCatalogProducts();

  const activeFolder = productFolders.find(
    (item) => item.id === selectedFolderId,
  );
  const productsWithLocalStock = applyLocalStock(
    catalogProducts,
    unavailableProductIds,
  );
  const catalogVisibleProducts = productsWithLocalStock.filter(
    (product) => product.available,
  );
  const catalogVisibleProductIds = new Set(
    catalogVisibleProducts.map((product) => product.id),
  );
  const visibleSelectedIds = selectedIds.filter((id) =>
    catalogVisibleProductIds.has(id),
  );
  const visibleSelectedPriceIds = Object.fromEntries(
    Object.entries(selectedPriceIds).filter(([id]) =>
      catalogVisibleProductIds.has(id),
    ),
  );
  const normalizedSearch = search.trim().toLowerCase();

  const filteredProductSections = activeFolder
    ? activeFolder.measures
        .map((measure) => {
          const measureProducts = orderProductsWithPairs(
            catalogVisibleProducts.filter((product) => {
              const matchesFolder = product.folderId === activeFolder.id;
              const matchesMeasure = product.measureCode === measure.code;
              const matchesSearch =
                normalizedSearch.length === 0 ||
                product.name.toLowerCase().includes(normalizedSearch) ||
                product.category.toLowerCase().includes(normalizedSearch);

              return matchesFolder && matchesMeasure && matchesSearch;
            }),
          );

          return {
            measure,
            products: measureProducts,
          };
        })
        .filter((section) => section.products.length > 0)
    : [];
  const filteredProductCount = filteredProductSections.reduce(
    (total, section) => total + section.products.length,
    0,
  );

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
    return catalogVisibleProducts.filter(
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

  function closeCatalogNotice() {
    setDismissedCatalogNotice(true);
  }

  function hideCatalogNoticePermanently() {
    window.localStorage.setItem(catalogNoticeStorageKey, "true");
    window.dispatchEvent(new Event(catalogNoticeChangeEvent));
    setDismissedCatalogNotice(true);
  }

  return (
    <main className="min-h-screen bg-[#f6f5f2] text-neutral-950">
      {showCatalogNotice ? (
        <div
          className="fixed inset-0 z-80 grid place-items-center bg-neutral-950/45 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="catalog-notice-title"
        >
          <div className="w-full max-w-md border border-neutral-200 bg-white p-5 shadow-[0_24px_70px_rgba(0,0,0,0.26)]">
            <Image
              src="/mava-logo.png"
              alt="MAVA Cuadros"
              width={861}
              height={610}
              priority
              className="mx-auto h-auto w-40 object-contain sm:w-42 p-4"
            />
            <p className="text-base font-semibold text-neutral-950 uppercase">
              - Las imágenes están impresas en tela y montadas sobre bastidor.
            </p>
            <p className="mt-2 text-base font-semibold text-neutral-950 uppercase">
              - Los cuadros están armados con el color de marco y fondo que
              creemos más conveniente, pero podemos charlar al respecto sobre
              modificaciones.
            </p>

            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={closeCatalogNotice}
                className="h-11 border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:border-neutral-950 hover:bg-neutral-100"
              >
                Entendido
              </button>
              <button
                type="button"
                onClick={hideCatalogNoticePermanently}
                className="h-11 bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-700"
              >
                No volver a mostrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="mx-auto w-full max-w-7xl px-2.5 pb-24 pt-3 sm:px-4 lg:px-6">
        <header className="mb-4 border-b border-neutral-300 pb-4">
          <div className="relative text-center">
            <div>
              <Image
                src="/mava-logo.png"
                alt="MAVA Cuadros"
                width={861}
                height={610}
                priority
                className="mx-auto h-auto w-42 object-contain sm:w-60 p-4"
              />
              <h1 className="sr-only">MAVA CUADROS</h1>
              <p className="mt-2 text-base font-semibold text-[#7E5E35]">
                {activeFolder
                  ? "Clickea las imagenes para realizar tu pedido"
                  : "Elegi un tamaño para ver los cuadros disponibles"}
              </p>
            </div>

            {isAdmin ? (
              <div className="mt-3 flex justify-center gap-2 sm:absolute sm:right-0 sm:top-0 sm:mt-0">
                <Link
                  href="/admin"
                  className="border border-[#7E5E35] bg-[#7E5E35] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#5F4627] sm:px-4 sm:text-sm"
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
                  <span className="block text-xs font-semibold text-neutral-500 transition group-hover:text-[#7E5E35]">
                    {getFolderProductCount(item.id)} cuadros disponibles
                  </span>
                  <span className="mt-4 flex flex-wrap gap-1.5">
                    {item.measures.map((measure) => (
                      <span
                        key={measure.code}
                        className="border border-neutral-200 bg-neutral-50 px-2 py-1 text-sm font-semibold text-neutral-700 transition group-hover:border-[#7E5E35]/40"
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

            {filteredProductCount > 0 ? (
              <div className="grid gap-8 pb-24">
                {filteredProductSections.map((section) => (
                  <section
                    key={section.measure.code}
                    className="pt-2 first:pt-0"
                    aria-labelledby={`${section.measure.code.toLowerCase()}-section-title`}
                  >
                    {activeFolder.measures.length > 1 ? (
                      <div className="mb-6 flex flex-col items-center justify-center border-y border-neutral-300 py-5">
                        <h2
                          id={`${section.measure.code.toLowerCase()}-section-title`}
                          className="text-sm font-bold uppercase tracking-[0.14em] text-neutral-950"
                        >
                          {section.measure.label}
                        </h2>
                        <p className="text-xs font-semibold text-neutral-500">
                          {section.measure.size}
                        </p>
                      </div>
                    ) : null}
                    <ProductGrid
                      products={section.products}
                      selectedIds={visibleSelectedIds}
                      selectedPriceIds={visibleSelectedPriceIds}
                      onToggle={toggleProduct}
                      onPriceToggle={toggleProductPrice}
                    />
                  </section>
                ))}
              </div>
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
          products={productsWithLocalStock}
          selectedIds={visibleSelectedIds}
          selectedPriceIds={visibleSelectedPriceIds}
          onClear={() => {
            setSelectedIds([]);
            setSelectedPriceIds({});
          }}
        />
      </div>
    </main>
  );
}
