"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCatalogProducts } from "@/components/useCatalogProducts";
import { productFolders, type ProductMeasureCode } from "@/data/products";
import {
  applyLocalStock,
  useAdminMode,
  useLocalStock,
} from "@/components/useAdminStock";

const measureOptions = productFolders.reduce<
  Array<{ code: ProductMeasureCode; label: string; size: string }>
>((options, folder) => {
  folder.measures.forEach((measure) => options.push(measure));

  return options;
}, []);

export function PrintStockClient() {
  const { isAdmin } = useAdminMode();
  const { unavailableProductIds } = useLocalStock();
  const catalogProducts = useCatalogProducts();
  const [selectedMeasures, setSelectedMeasures] = useState<
    ProductMeasureCode[]
  >([]);
  const [loadedImageSources, setLoadedImageSources] = useState<Set<string>>(
    () => new Set(),
  );
  const [failedImageSources, setFailedImageSources] = useState<Set<string>>(
    () => new Set(),
  );
  const [preparingPrint, setPreparingPrint] = useState(false);
  const [printError, setPrintError] = useState("");
  const productsWithLocalStock = applyLocalStock(
    catalogProducts,
    unavailableProductIds,
  );
  const productCountByMeasure = useMemo(
    () =>
      productsWithLocalStock.reduce<Partial<Record<ProductMeasureCode, number>>>(
        (counts, product) => {
          counts[product.measureCode] =
            (counts[product.measureCode] ?? 0) + 1;

          return counts;
        },
        {},
      ),
    [productsWithLocalStock],
  );
  const selectedProducts = productsWithLocalStock.filter((product) =>
    selectedMeasures.includes(product.measureCode),
  );
  const selectedMeasureLabels = measureOptions
    .filter((measure) => selectedMeasures.includes(measure.code))
    .map((measure) => measure.label);
  const loadedImageCount = selectedProducts.filter((product) =>
    loadedImageSources.has(product.image.src),
  ).length;
  const failedImageCount = selectedProducts.filter((product) =>
    failedImageSources.has(product.image.src),
  ).length;
  const selectedImagesReady =
    selectedProducts.length > 0 &&
    loadedImageCount === selectedProducts.length &&
    failedImageCount === 0;
  const today = new Intl.DateTimeFormat("es-AR").format(new Date());

  function toggleMeasure(measureCode: ProductMeasureCode) {
    setSelectedMeasures((current) =>
      current.includes(measureCode)
        ? current.filter((code) => code !== measureCode)
        : [...current, measureCode],
    );
  }

  function markImageLoaded(source: string) {
    setLoadedImageSources((current) => {
      if (current.has(source)) {
        return current;
      }

      const next = new Set(current);
      next.add(source);
      return next;
    });
    setFailedImageSources((current) => {
      if (!current.has(source)) {
        return current;
      }

      const next = new Set(current);
      next.delete(source);
      return next;
    });
  }

  function markImageFailed(source: string) {
    setFailedImageSources((current) => {
      const next = new Set(current);
      next.add(source);
      return next;
    });
  }

  async function printPage() {
    setPreparingPrint(true);
    setPrintError("");

    try {
      const images = Array.from(
        document.querySelectorAll<HTMLImageElement>("[data-stock-print-image]"),
      );

      await Promise.all(
        images.map(async (image) => {
          if (!image.complete || image.naturalWidth === 0) {
            throw new Error("Hay imagenes que todavia no terminaron de cargar.");
          }

          await image.decode();
        }),
      );
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() =>
          window.requestAnimationFrame(() => resolve()),
        );
      });
      window.print();
    } catch (error) {
      setPrintError(
        error instanceof Error
          ? error.message
          : "No se pudieron preparar todas las imagenes.",
      );
    } finally {
      setPreparingPrint(false);
    }
  }

  return (
    <main className="print-page mx-auto w-full max-w-6xl px-4 py-8 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Link
          href="/"
          className="h-11 border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-950"
        >
          Volver
        </Link>
        {isAdmin ? (
          <button
            type="button"
            onClick={() => {
              void printPage();
            }}
            disabled={!selectedImagesReady || preparingPrint}
            className="h-11 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {preparingPrint
              ? "Preparando impresion..."
              : selectedProducts.length > 0 && !selectedImagesReady
                ? `Cargando imagenes ${loadedImageCount}/${selectedProducts.length}`
                : "Imprimir / guardar PDF"}
          </button>
        ) : null}
      </div>

      {isAdmin ? (
        <section className="mb-6 border border-neutral-300 bg-white p-4 shadow-sm print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-neutral-950">
                Elegir carpetas para imprimir
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Podes seleccionar una o combinar varias medidas.
              </p>
            </div>
            {selectedMeasures.length > 0 ? (
              <button
                type="button"
                onClick={() => setSelectedMeasures([])}
                className="border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
              >
                Limpiar seleccion
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {measureOptions.map((measure) => {
              const isSelected = selectedMeasures.includes(measure.code);

              return (
                <label
                  key={measure.code}
                  className={`flex cursor-pointer items-center gap-3 border px-3 py-3 transition ${
                    isSelected
                      ? "border-[#7E5E35] bg-[#7E5E35] text-white"
                      : "border-neutral-300 bg-white text-neutral-900 hover:border-[#7E5E35]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleMeasure(measure.code)}
                    className="size-4 accent-[#7E5E35]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {measure.label}
                    </span>
                    <span
                      className={`block text-xs ${
                        isSelected ? "text-white/80" : "text-neutral-500"
                      }`}
                    >
                      {productCountByMeasure[measure.code] ?? 0} items
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {failedImageCount > 0 ? (
            <p className="mt-3 text-sm font-semibold text-red-700">
              {failedImageCount === 1
                ? "Una imagen no pudo cargarse. Recarga la pagina antes de imprimir."
                : `${failedImageCount} imagenes no pudieron cargarse. Recarga la pagina antes de imprimir.`}
            </p>
          ) : null}
          {printError ? (
            <p className="mt-3 text-sm font-semibold text-red-700">
              {printError}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="bg-white p-5 shadow-sm print:p-0 print:shadow-none">
        <header className="mb-4 border-b border-neutral-300 pb-4 print:mb-2 print:pb-2">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase text-[#7E5E35]">
                Mava Cuadros
              </p>
              <h1 className="mt-1 text-2xl font-semibold print:text-xl">
                {selectedMeasureLabels.length > 0
                  ? `Stock ${selectedMeasureLabels.join(" + ")}`
                  : "Stock"}
              </h1>
            </div>
            <div className="text-sm text-neutral-700 print:text-xs">
              <p>
                <span className="font-semibold">Fecha:</span>{" "}
                <span suppressHydrationWarning>{today}</span>
              </p>
              <p>
                <span className="font-semibold">Total:</span>{" "}
                {selectedProducts.length}
              </p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-3 gap-2 sm:grid-cols-6 print:grid-cols-6 print:gap-x-1 print:gap-y-0.5">
          {selectedProducts.map((product) => (
            <article
              key={product.id}
              className="w-[90%] justify-self-center break-inside-avoid"
            >
              <Image
                src={product.image}
                alt={product.code}
                loading="eager"
                sizes="(min-width: 640px) 15vw, 30vw"
                className="h-auto w-full object-contain"
                data-stock-print-image
                onLoad={() => markImageLoaded(product.image.src)}
                onError={() => markImageFailed(product.image.src)}
              />
              <p className="mt-0.5 text-center text-[8px] font-semibold uppercase leading-none text-neutral-700">
                {product.available ? "En stock" : "Sin stock"}
              </p>
            </article>
          ))}
          {selectedMeasures.length === 0 ? (
            <p className="col-span-full border border-dashed border-neutral-300 px-4 py-12 text-center text-sm text-neutral-500 print:hidden">
              Elegi al menos una carpeta para preparar la impresion.
            </p>
          ) : null}
        </section>
      </section>
    </main>
  );
}
