"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { FramePreview } from "@/components/FramePreview";
import {
  applyLocalStock,
  useAdminMode,
  useLocalStock,
} from "@/components/useAdminStock";
import { orderStatusLabels, type CustomerOrder } from "@/data/orders";
import {
  createSelectionSearchParams,
  formatPriceTotal,
  getProductPriceOptions,
  getSelectedPriceTotal,
  parseSelectionParams,
  type PriceOptionId,
  products,
} from "@/data/products";

type ShareSelectionClientProps = {
  orderId?: string;
  savedOrder?: CustomerOrder | null;
  savedOrderError?: string;
};

export function ShareSelectionClient({
  orderId = "",
  savedOrder = null,
  savedOrderError = "",
}: ShareSelectionClientProps) {
  if (orderId) {
    return (
      <SavedOrderShareView
        order={savedOrder}
        orderId={orderId}
        orderError={savedOrderError}
      />
    );
  }

  return <TemporarySelectionShareView />;
}

function TemporarySelectionShareView() {
  const searchParams = useSearchParams();
  const { isAdmin } = useAdminMode();
  const { createFinishedOrder, unavailableProductIds } = useLocalStock();
  const [finishingOrder, setFinishingOrder] = useState(false);
  const [finishError, setFinishError] = useState("");
  const { ids, selectedPriceIds } = parseSelectionParams(searchParams);
  const checklistParams = createSelectionSearchParams(ids, selectedPriceIds);

  const productsWithLocalStock = applyLocalStock(products, unavailableProductIds);
  const selectedProducts = productsWithLocalStock.filter((product) =>
    ids.includes(product.id),
  );
  const selectedProductIds = selectedProducts.map((product) => product.id);
  const selectedCodes = selectedProducts
    .map((product) => product.code)
    .join(", ");
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
  const finishedOrder =
    selectedProducts.length > 0 &&
    selectedProducts.every((product) => !product.available);

  async function finishOrder() {
    const confirmed = window.confirm(
      "Vas a marcar estos cuadros como sin stock. Queres continuar?",
    );

    if (confirmed) {
      setFinishingOrder(true);
      setFinishError("");

      try {
        await createFinishedOrder({
          productCodes: selectedProducts.map((product) => product.code),
          productIds: selectedProductIds,
          selectedPriceIds,
          sharePath: `/compartir?${checklistParams.toString()}`,
          totalInThousands: totalPrice,
        });
      } catch (error) {
        setFinishError(
          error instanceof Error ? error.message : "No se pudo terminar pedido",
        );
      } finally {
        setFinishingOrder(false);
      }
    }
  }

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

          <div className="flex flex-wrap justify-end gap-2">
            {isAdmin && selectedProducts.length > 0 ? (
              <button
                type="button"
                onClick={finishOrder}
                disabled={finishedOrder || finishingOrder}
                className="bg-[#7E5E35] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5F4627] disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {finishedOrder
                  ? "Pedido terminado"
                  : finishingOrder
                    ? "Terminando..."
                    : "Marcar pedido terminado"}
              </button>
            ) : null}
            {isAdmin && selectedProducts.length > 0 ? (
              <Link
                href={`/planilla?${checklistParams.toString()}`}
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

        {finishError ? (
          <div className="mb-4 border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-semibold text-red-700">
              {finishError}
            </p>
          </div>
        ) : null}

        {selectedProducts.length === 0 ? (
          <section className="border border-neutral-200 bg-white px-6 py-14 text-center shadow-sm">
            <h2 className="text-xl font-semibold">No hay cuadros para mostrar</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
              El link no tiene una seleccion valida.
            </p>
          </section>
        ) : (
          <>
            <section className="mb-6 border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase text-neutral-500">
                    Codigos seleccionados
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-6">
                    {selectedCodes}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs font-semibold uppercase text-neutral-500">
                    Total
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
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {selectedProducts.map((product) => (
                <article
                  key={product.id}
                  className={`border border-neutral-200 bg-white p-3 shadow-sm ${
                    product.available ? "" : "opacity-45 grayscale"
                  }`}
                >
                  <div className="relative bg-[#efede8] p-2">
                    <FramePreview
                      product={product}
                      selectedPriceId={selectedPriceIds[product.id]}
                    />
                    {!product.available ? (
                      <span className="absolute left-3 top-3 bg-neutral-950 px-2 py-1 text-[11px] font-semibold text-white">
                        Sin stock
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 space-y-2">
                    <div>
                      <h2 className="font-mono text-sm font-semibold uppercase leading-snug">
                        {product.code}
                      </h2>
                    </div>
                    <div className="space-y-1 border-t border-neutral-100 pt-3 text-xs">
                      <p className="leading-tight text-neutral-500">
                        {product.size}
                      </p>
                      <p className="text-neutral-500">{product.category}</p>
                    </div>
                    <div
                      className={`grid gap-2 text-[11px] ${
                        getProductPriceOptions(product).length === 1
                          ? "grid-cols-1"
                          : "grid-cols-2"
                      }`}
                    >
                      {getProductPriceOptions(product).map((option) => {
                        const active = selectedPriceIds[product.id] === option.id;

                        return (
                          <div
                            key={option.id}
                            className={`border p-2 ${
                              active
                                ? "border-[#7E5E35] bg-[#7E5E35] text-white"
                                : "border-neutral-200"
                            }`}
                          >
                            <p
                              className={`truncate ${
                                active ? "text-white/80" : "text-neutral-500"
                              }`}
                            >
                              {option.shortLabel}
                            </p>
                            <p className="mt-0.5 font-semibold">
                              {option.price}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    {!selectedPriceIds[product.id] ? (
                      <p className="text-[11px] font-medium text-neutral-500">
                        Precio sin elegir
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

type SavedOrderShareViewProps = {
  order: CustomerOrder | null;
  orderError: string;
  orderId: string;
};

function SavedOrderShareView({
  order,
  orderError,
  orderId,
}: SavedOrderShareViewProps) {
  const { isAdmin } = useAdminMode();
  const planillaHref = order
    ? `/planilla?pedido=${encodeURIComponent(order.id)}`
    : "";
  const selectedCodes = order?.items.map((item) => item.code).join(", ") ?? "";

  return (
    <main className="min-h-screen bg-[#f6f5f2] text-neutral-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col justify-between gap-4 border-b border-neutral-300 pb-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-semibold uppercase text-neutral-500">
              Pedido guardado
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              Cuadros solicitados
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">
              Pedido #{getShortOrderId(orderId)} cargado desde el registro
              guardado.
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {isAdmin && planillaHref ? (
              <Link
                href={planillaHref}
                target="_blank"
                className="bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Imprimir planilla
              </Link>
            ) : null}
            {isAdmin ? (
              <Link
                href="/admin"
                className="border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-950"
              >
                Panel admin
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

        {!order ? (
          <section className="border border-neutral-200 bg-white px-6 py-14 text-center shadow-sm">
            <h2 className="text-xl font-semibold">No hay pedido para mostrar</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
              {orderError || "El link no tiene un pedido valido."}
            </p>
          </section>
        ) : (
          <>
            <section className="mb-6 border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="border border-[#7E5E35]/30 bg-[#7E5E35]/10 px-2 py-1 text-xs font-semibold text-[#5F4627]">
                      {orderStatusLabels[order.status]}
                    </span>
                    <span className="text-xs font-semibold uppercase text-neutral-500">
                      {formatOrderDate(order.createdAt)}
                    </span>
                  </div>
                  <h2 className="mt-2 text-xl font-semibold">
                    {order.customerName}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
                    <span>WhatsApp: {order.whatsapp}</span>
                    {order.businessName ? (
                      <span>Local / empresa: {order.businessName}</span>
                    ) : null}
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase text-neutral-500">
                      Codigos seleccionados
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6">
                      {selectedCodes}
                    </p>
                  </div>
                </div>

                <div className="lg:text-right">
                  <p className="text-xs font-semibold uppercase text-neutral-500">
                    Total
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">
                    {formatMoney(order.total)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-neutral-500">
                    {order.items.length}{" "}
                    {order.items.length === 1 ? "cuadro" : "cuadros"}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {order.items.map((item, index) => (
                <SavedOrderItemCard key={`${item.id}-${index}`} item={item} />
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

type SavedOrderItemCardProps = {
  item: CustomerOrder["items"][number];
};

function SavedOrderItemCard({ item }: SavedOrderItemCardProps) {
  const product = products.find((current) => current.id === item.id);
  const selectedPriceId = isPriceOptionId(item.background)
    ? item.background
    : undefined;

  return (
    <article className="border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="relative bg-[#efede8] p-2">
        {product ? (
          <FramePreview product={product} selectedPriceId={selectedPriceId} />
        ) : (
          <div className="grid aspect-[4/5] place-items-center border border-dashed border-neutral-300 bg-white px-3 text-center">
            <p className="text-xs font-semibold text-neutral-500">
              {item.code}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <div>
          <h2 className="font-mono text-sm font-semibold uppercase leading-snug">
            {item.code}
          </h2>
        </div>
        <div className="space-y-1 border-t border-neutral-100 pt-3 text-xs">
          <p className="leading-tight text-neutral-500">{item.size}</p>
          <p className="text-neutral-500">
            {item.backgroundLabel || "Precio"}
          </p>
        </div>
        <div className="flex min-h-8 items-center justify-between gap-2 border border-[#7E5E35]/30 bg-[#7E5E35]/10 px-2 py-1.5 text-[11px]">
          <span className="truncate font-semibold text-[#7E5E35]">
            {item.backgroundLabel || "Precio"}
          </span>
          <span className="shrink-0 font-semibold text-neutral-950">
            {formatMoney(item.price)}
          </span>
        </div>
      </div>
    </article>
  );
}

function isPriceOptionId(value: string): value is PriceOptionId {
  return value === "blanco" || value === "arpillera" || value === "base";
}

function formatMoney(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}

function formatOrderDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getShortOrderId(id: string) {
  return id.slice(0, 8).toUpperCase();
}
