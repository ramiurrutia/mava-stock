"use client";

import Link from "next/link";
import { FramePreview } from "@/components/FramePreview";
import { getProductPriceOptions, products } from "@/data/products";
import {
  applyLocalStock,
  useAdminMode,
  useLocalStock,
} from "@/components/useAdminStock";

export function PrintStockClient() {
  const { isAdmin } = useAdminMode();
  const { unavailableProductIds } = useLocalStock();
  const productsWithLocalStock = applyLocalStock(products, unavailableProductIds);
  const today = new Intl.DateTimeFormat("es-AR").format(new Date());

  function printPage() {
    window.print();
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
            onClick={printPage}
            className="h-11 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Imprimir / guardar PDF
          </button>
        ) : null}
      </div>

      <section className="bg-white p-5 shadow-sm print:p-0 print:shadow-none">
        <header className="border-b border-neutral-300 pb-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase text-[#7E5E35]">
                Mava Cuadros
              </p>
              <h1 className="mt-1 text-2xl font-semibold">
                Catalogo completo de stock
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                Listado imprimible con codigo y medida de cada cuadro.
              </p>
            </div>
            <div className="text-sm text-neutral-700">
              <p>
                <span className="font-semibold">Fecha:</span> {today}
              </p>
              <p>
                <span className="font-semibold">Total:</span>{" "}
                {productsWithLocalStock.length}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-4 grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 print:gap-1.5">
          {productsWithLocalStock.map((product) => (
            <article
              key={product.id}
              className={`break-inside-avoid border border-neutral-300 p-1.5 ${
                product.available ? "" : "opacity-55 grayscale"
              }`}
            >
              <div className="grid grid-cols-[52px_1fr] gap-2">
                <div className="w-13">
                  <FramePreview product={product} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className={`text-[9px] font-semibold uppercase ${
                        product.available ? "text-[#7E5E35]" : "text-neutral-500"
                      }`}
                    >
                      {product.available ? "Stock" : "Sin stock"}
                    </span>
                    <span className="truncate text-[9px] text-neutral-500">
                      {product.category}
                    </span>
                  </div>

                  <h2 className="mt-0.5 text-sm font-semibold leading-tight">
                    {product.code}
                  </h2>
                  <p className="mt-1 text-[10px] font-semibold text-neutral-950">
                    {product.size}
                  </p>
                  <p className="mt-1 text-[9px] leading-tight text-neutral-600">
                    {getProductPriceOptions(product)
                      .map((option) => `${option.shortLabel} ${option.price}`)
                      .join(" / ")}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
