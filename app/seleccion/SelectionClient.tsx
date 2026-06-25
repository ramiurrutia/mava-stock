"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import { FramePreview } from "@/components/FramePreview";
import { priceOptions, products } from "@/data/products";

export function SelectionClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ids = searchParams
    .get("ids")
    ?.split(",")
    .map((id) => id.trim())
    .filter(Boolean) ?? [];

  const selectedProducts = products.filter((product) => ids.includes(product.id));

  function removeProduct(id: string) {
    const nextIds = ids.filter((item) => item !== id);
    router.replace(
      nextIds.length > 0 ? `/seleccion?ids=${nextIds.join(",")}` : "/seleccion",
    );
  }

  function clearSelection() {
    const confirmed = window.confirm(
      "Vas a vaciar toda la seleccion. Queres continuar?",
    );

    if (confirmed) {
      router.replace("/seleccion");
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f5f2] text-neutral-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-start justify-between gap-4 border-b border-neutral-300 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase text-neutral-500">
              Mi seleccion
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              Revisar pedido
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">
              Confirma los cuadros antes de compartir la consulta.
            </p>
          </div>

          <Link
            href="/"
            className="border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
          >
            Catalogo
          </Link>
        </header>

        {selectedProducts.length === 0 ? (
          <section className="border border-neutral-200 bg-white px-6 py-14 text-center shadow-sm">
            <h2 className="text-xl font-semibold">
              Todavia no hay cuadros seleccionados
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
              Volve al catalogo y toca los cuadros que queres consultar.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex h-11 items-center bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Ir al catalogo
            </Link>
          </section>
        ) : (
          <>
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-semibold">
                  {selectedProducts.length} cuadros en revision
                </p>
                <p className="text-sm text-neutral-500">
                  Usa Quitar solo si queres sacar un cuadro del pedido.
                </p>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="text-left text-sm font-semibold text-neutral-500 underline-offset-4 hover:text-neutral-950 hover:underline sm:text-right"
              >
                Vaciar seleccion
              </button>
            </div>

            <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {selectedProducts.map((product) => (
                <SelectedProductCard
                  key={product.id}
                  product={product}
                  onRemove={() => removeProduct(product.id)}
                />
              ))}
            </section>

            <CheckoutForm selectedProducts={selectedProducts} />
          </>
        )}
      </div>
    </main>
  );
}

type SelectedProductCardProps = {
  product: (typeof products)[number];
  onRemove: () => void;
};

function SelectedProductCard({ product, onRemove }: SelectedProductCardProps) {
  const isUnavailable = !product.available;

  return (
    <article
      className={`border border-neutral-200 bg-white p-3 shadow-sm ${
        isUnavailable ? "opacity-45 grayscale" : ""
      }`}
    >
      <div className="relative bg-[#efede8] p-2">
        <FramePreview product={product} />
        {isUnavailable ? (
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
          <p className="leading-tight text-neutral-500">{product.size}</p>
          <p className="text-neutral-500">{product.category}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {priceOptions.map((option) => (
            <div key={option.label} className="border border-neutral-200 p-2">
              <p className="truncate text-neutral-500">{option.shortLabel}</p>
              <p className="mt-0.5 font-semibold text-neutral-950">
                {option.price}
              </p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="h-10 w-full border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-950"
        >
          Quitar
        </button>
      </div>
    </article>
  );
}
