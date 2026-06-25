"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FramePreview } from "@/components/FramePreview";
import { priceOptions, products } from "@/data/products";

export function ShareSelectionClient() {
  const searchParams = useSearchParams();
  const ids =
    searchParams
      .get("ids")
      ?.split(",")
      .map((id) => id.trim())
      .filter(Boolean) ?? [];

  const selectedProducts = products.filter((product) => ids.includes(product.id));

  return (
    <main className="min-h-screen bg-[#f6f5f2] text-neutral-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col justify-between gap-4 border-b border-neutral-300 pb-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-semibold uppercase text-neutral-500">
              Seleccion visual
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              Cuadros solicitados
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">
              Vista compartida por WhatsApp con los codigos y cuadros elegidos.
            </p>
          </div>

          <div className="flex gap-2">
            {selectedProducts.length > 0 ? (
              <Link
                href={`/planilla?ids=${ids.join(",")}`}
                target="_blank"
                className="bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Imprimir planilla
              </Link>
            ) : null}
            <Link
              href="/"
              className="border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-950"
            >
              Catalogo
            </Link>
          </div>
        </header>

        {selectedProducts.length === 0 ? (
          <section className="border border-neutral-200 bg-white px-6 py-14 text-center shadow-sm">
            <h2 className="text-xl font-semibold">No hay cuadros para mostrar</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
              El link no tiene una seleccion valida.
            </p>
          </section>
        ) : (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {selectedProducts.map((product) => (
              <article
                key={product.id}
                className={`border border-neutral-200 bg-white p-3 shadow-sm ${
                  product.available ? "" : "opacity-45 grayscale"
                }`}
              >
                <div className="relative bg-[#efede8] p-2">
                  <FramePreview product={product} />
                  {!product.available ? (
                    <span className="absolute left-3 top-3 bg-neutral-950 px-2 py-1 text-[11px] font-semibold text-white">
                      Sin stock
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 space-y-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-neutral-500">
                      {product.code}
                    </p>
                    <h2 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">
                      {product.name}
                    </h2>
                  </div>
                  <div className="space-y-1 border-t border-neutral-100 pt-3 text-xs">
                    <p className="leading-tight text-neutral-500">
                      {product.size}
                    </p>
                    <p className="text-neutral-500">{product.category}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {priceOptions.map((option) => (
                      <div key={option.label} className="border border-neutral-200 p-2">
                        <p className="truncate text-neutral-500">
                          {option.shortLabel}
                        </p>
                        <p className="mt-0.5 font-semibold text-neutral-950">
                          {option.price}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
