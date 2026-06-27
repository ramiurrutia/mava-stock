"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import { FramePreview } from "@/components/FramePreview";
import {
  applyLocalStock,
  useLocalStock,
} from "@/components/useAdminStock";
import {
  createSelectionSearchParams,
  formatPriceTotal,
  getProductPriceOptions,
  getSelectedPriceTotal,
  parseSelectionParams,
  products,
  type PriceOptionId,
} from "@/data/products";

export function SelectionClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showCheckoutCta, setShowCheckoutCta] = useState(true);
  const { unavailableProductIds } = useLocalStock();
  const { ids, selectedPriceIds } = parseSelectionParams(searchParams);

  const productsWithLocalStock = applyLocalStock(products, unavailableProductIds);
  const selectedProducts = productsWithLocalStock.filter((product) =>
    ids.includes(product.id),
  );
  const selectedProductIds = selectedProducts.map((product) => product.id);
  const totalPrice = getSelectedPriceTotal(selectedProductIds, selectedPriceIds);
  const unpricedCount = selectedProductIds.filter(
    (id) => {
      const product = selectedProducts.find((item) => item.id === id);

      return product
        ? !getProductPriceOptions(product).some(
            (option) => option.id === selectedPriceIds[id],
          )
        : true;
    },
  ).length;

  useEffect(() => {
    function updateCheckoutCtaVisibility() {
      const checkout = document.getElementById("checkout-form");
      const checkoutTop =
        checkout?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollBottom = window.scrollY + window.innerHeight;
      const checkoutIsVisible = checkoutTop < window.innerHeight - 80;
      const isNearPageEnd = documentHeight - scrollBottom < 120;

      setShowCheckoutCta(!checkoutIsVisible && !isNearPageEnd);
    }

    updateCheckoutCtaVisibility();
    window.addEventListener("scroll", updateCheckoutCtaVisibility, {
      passive: true,
    });
    window.addEventListener("resize", updateCheckoutCtaVisibility);

    return () => {
      window.removeEventListener("scroll", updateCheckoutCtaVisibility);
      window.removeEventListener("resize", updateCheckoutCtaVisibility);
    };
  }, [selectedProducts.length]);

  function buildSelectionUrl(nextIds: string[]) {
    if (nextIds.length === 0) {
      return "/seleccion";
    }

    const nextParams = createSelectionSearchParams(
      nextIds,
      selectedPriceIds,
    );

    return `/seleccion?${nextParams.toString()}`;
  }

  function removeProduct(id: string) {
    const nextIds = ids.filter((item) => item !== id);
    router.replace(buildSelectionUrl(nextIds));
  }

  function clearSelection() {
    const confirmed = window.confirm(
      "Vas a vaciar toda la seleccion. Queres continuar?",
    );

    if (confirmed) {
      router.replace("/seleccion");
    }
  }

  function scrollToCheckout() {
    document
      .getElementById("checkout-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
              <div className="sm:text-right">
                <p className="text-xs font-semibold uppercase text-neutral-500">
                  Total seleccionado
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {formatPriceTotal(totalPrice)}
                </p>
                {unpricedCount > 0 ? (
                  <p className="mt-1 text-xs font-medium text-neutral-500">
                    {unpricedCount}{" "}
                    {unpricedCount === 1
                      ? "cuadro sin precio"
                      : "cuadros sin precio"}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={clearSelection}
                  className="mt-2 text-left text-sm font-semibold text-neutral-500 underline-offset-4 hover:text-neutral-950 hover:underline sm:text-right"
                >
                  Vaciar seleccion
                </button>
              </div>
            </div>

            <section className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
              {selectedProducts.map((product) => (
                <SelectedProductCard
                  key={product.id}
                  product={product}
                  selectedPriceId={selectedPriceIds[product.id]}
                  onRemove={() => removeProduct(product.id)}
                />
              ))}
            </section>

            <section id="checkout-form" className="scroll-mt-4 pb-20 sm:pb-0">
              <CheckoutForm
                selectedProducts={selectedProducts}
                selectedPriceIds={selectedPriceIds}
              />
            </section>

            <div
              className={`pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 transition duration-300 sm:hidden ${
                showCheckoutCta
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
            >
              <button
                type="button"
                onClick={scrollToCheckout}
                className={`checkout-floating-cta flex h-12 min-w-[220px] items-center justify-center border-2 border-neutral-950 bg-neutral-950 px-6 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(0,0,0,0.32)] transition active:translate-y-0.5 active:bg-neutral-800 ${
                  showCheckoutCta ? "pointer-events-auto" : "pointer-events-none"
                }`}
              >
                Finalizar pedido
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

type SelectedProductCardProps = {
  product: (typeof products)[number];
  selectedPriceId?: PriceOptionId;
  onRemove: () => void;
};

function SelectedProductCard({
  product,
  selectedPriceId,
  onRemove,
}: SelectedProductCardProps) {
  const isUnavailable = !product.available;
  const priceOptions = getProductPriceOptions(product);
  const selectedPrice = priceOptions.find(
    (option) => option.id === selectedPriceId,
  );

  return (
    <article
      className={`flex h-full flex-col border border-neutral-200 bg-white p-3 shadow-sm ${
        isUnavailable ? "opacity-45 grayscale" : ""
      }`}
    >
      <div className="relative bg-[#efede8] p-2">
        <FramePreview product={product} selectedPriceId={selectedPriceId} />
        {isUnavailable ? (
          <span className="absolute left-3 top-3 bg-neutral-950 px-2 py-1 text-[11px] font-semibold text-white">
            Sin stock
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-2">
        <div>
          <p className="text-xs font-semibold uppercase text-neutral-500">
            {product.code}
          </p>
          <h2 className="mt-1 line-clamp-2 min-h-[38px] text-sm font-semibold leading-snug">
            {product.name}
          </h2>
        </div>
        <div className="space-y-1 border-t border-neutral-100 pt-3 text-xs">
          <p className="leading-tight text-neutral-500">{product.size}</p>
          <p className="text-neutral-500">{product.category}</p>
        </div>
        {selectedPrice ? (
          <div className="flex min-h-8 items-center justify-between gap-2 border border-[#1f6f65]/30 bg-[#1f6f65]/10 px-2 py-1.5 text-[11px]">
            <span className="truncate font-semibold text-[#1f6f65]">
              {selectedPrice.shortLabel}
            </span>
            <span className="shrink-0 font-semibold text-neutral-950">
              {selectedPrice.price}
            </span>
          </div>
        ) : (
          <p className="border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-[11px] font-medium text-neutral-500">
            Sin precio $0
          </p>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="mt-auto h-8 w-full border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-800 transition hover:border-neutral-950"
        >
          Quitar
        </button>
      </div>
    </article>
  );
}
