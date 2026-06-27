"use client";

import Link from "next/link";
import { useState } from "react";
import { FramePreview } from "@/components/FramePreview";
import {
  applyLocalStock,
  useAdminMode,
  useFinishedOrders,
  useLocalStock,
} from "@/components/useAdminStock";
import {
  orderStatuses,
  orderStatusLabels,
  type CustomerOrder,
  type OrderStatus,
} from "@/data/orders";
import { productFolders, products, type Product } from "@/data/products";

const allStockStates = "todos";
const allFolders = "todas";
type AdminView = "stock" | "pedidos";

export function AdminClient() {
  const { checkingAdmin, isAdmin, loginAdmin, logoutAdmin } = useAdminMode();
  const {
    markProductsAvailable,
    markProductsUnavailable,
    setProductAvailability,
    unavailableProductIds,
  } = useLocalStock();
  const {
    deleteOrder,
    deletingOrderId,
    orders,
    ordersError,
    updateOrderStatus,
    updatingOrderId,
  } = useFinishedOrders();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stockState, setStockState] = useState(allStockStates);
  const [folder, setFolder] = useState(allFolders);
  const [adminView, setAdminView] = useState<AdminView>("stock");
  const [actionError, setActionError] = useState("");
  const productsWithLocalStock = applyLocalStock(products, unavailableProductIds);
  const activeFolder = productFolders.find((item) => item.id === folder);
  const normalizedSearch = search.trim().toLowerCase();
  const availableCount = productsWithLocalStock.filter(
    (product) => product.available,
  ).length;
  const unavailableCount = productsWithLocalStock.length - availableCount;
  const filteredProducts = productsWithLocalStock.filter((product) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      product.code.toLowerCase().includes(normalizedSearch) ||
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.category.toLowerCase().includes(normalizedSearch) ||
      product.size.toLowerCase().includes(normalizedSearch);
    const matchesStockState =
      stockState === allStockStates ||
      (stockState === "stock" && product.available) ||
      (stockState === "sin-stock" && !product.available);
    const matchesFolder = folder === allFolders || product.folderId === folder;

    return matchesSearch && matchesStockState && matchesFolder;
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const loggedIn = await loginAdmin(password.trim());

    if (!loggedIn) {
      setError("Clave incorrecta");
      return;
    }

    setPassword("");
    setError("");
  }

  async function runStockAction(action: () => Promise<unknown>) {
    setActionError("");

    try {
      await action();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "No se pudo actualizar stock",
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f5f2] px-4 py-6 text-neutral-950">
      <section
        className={`mx-auto w-full border border-neutral-200 bg-white p-5 shadow-sm ${
          isAdmin ? "max-w-7xl" : "max-w-md"
        }`}
      >
        <div className="flex flex-col justify-between gap-3 border-b border-neutral-200 pb-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-semibold uppercase text-neutral-500">
              Mava Cuadros
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Acceso admin
            </h1>
          </div>

          {isAdmin ? (
            <div className="flex gap-2">
              <Link
                href="/"
                className="border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
              >
                Catalogo
              </Link>
              <button
                type="button"
                onClick={logoutAdmin}
                className="border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
              >
                Cerrar admin
              </button>
            </div>
          ) : null}
        </div>

        {checkingAdmin ? (
          <AdminLoadingState />
        ) : isAdmin ? (
          <div className="mt-5 space-y-5">
            <div className="border border-[#1f6f65] bg-[#1f6f65]/10 p-3">
              <p className="text-sm font-semibold text-[#185950]">
                Modo admin activo en este navegador.
              </p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Podes imprimir, terminar pedidos y administrar el stock manual.
              </p>
            </div>

            {actionError ? (
              <div className="border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-semibold text-red-700">
                  {actionError}
                </p>
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-3">
              <SummaryBox label="En stock" value={availableCount} />
              <SummaryBox label="Sin stock" value={unavailableCount} />
              <SummaryBox label="Total" value={productsWithLocalStock.length} />
            </div>

            <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-4">
              {[
                ["stock", "Ver stock"],
                ["pedidos", "Ver pedidos"],
              ].map(([id, label]) => {
                const active = adminView === id;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAdminView(id as AdminView)}
                    className={`h-11 border px-4 text-sm font-semibold transition ${
                      active
                        ? "border-neutral-950 bg-neutral-950 text-white"
                        : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-950"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {adminView === "stock" ? (
              <>
                <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                  <label className="space-y-2 text-sm font-semibold text-neutral-700">
                    Buscar cuadro
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Codigo, nombre, medida o categoria"
                      className="h-12 w-full border border-neutral-300 px-3 text-base text-neutral-950 outline-none transition focus:border-neutral-950"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      [allStockStates, "Todos"],
                      ["stock", "En stock"],
                      ["sin-stock", "Sin stock"],
                    ].map(([id, label]) => {
                      const active = stockState === id;

                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setStockState(id)}
                          className={`h-11 border px-4 text-sm font-semibold transition ${
                            active
                              ? "border-neutral-950 bg-neutral-950 text-white"
                              : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-950"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
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
                    aria-label="Filtrar stock por carpeta de medidas"
                    className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5"
                  >
                    <button
                      type="button"
                      onClick={() => setFolder(allFolders)}
                      className={`min-h-[72px] min-w-0 border px-2.5 py-2 text-left transition sm:px-3 ${
                        folder === allFolders
                          ? "border-neutral-950 bg-neutral-950 text-white"
                          : "border-neutral-300 bg-white text-neutral-950 hover:border-neutral-950"
                      }`}
                    >
                      <span className="block text-[10px] font-semibold uppercase tracking-wide text-current opacity-65 sm:text-[11px]">
                        Todas
                      </span>
                      <span
                        className={`mt-1 block text-xs font-semibold ${
                          folder === allFolders
                            ? "text-neutral-200"
                            : "text-neutral-500"
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
                          onClick={() => setFolder(item.id)}
                          className={`min-h-[72px] min-w-0 border px-2.5 py-2 text-left transition sm:px-3 ${
                            active
                              ? "border-neutral-950 bg-neutral-950 text-white"
                              : "border-neutral-300 bg-white text-neutral-950 hover:border-neutral-950"
                          }`}
                        >
                          <span
                            className={`block text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] ${
                              active ? "text-neutral-300" : "text-neutral-400"
                            }`}
                          >
                            {item.label}
                          </span>
                          <span className="mt-1.5 flex flex-wrap gap-1">
                            {item.measures.map((measureOption) => (
                              <span
                                key={measureOption.code}
                                className={`inline-flex min-w-0 items-baseline gap-1 border px-1.5 py-1 leading-none ${
                                  active
                                    ? "border-white/30 bg-white/10 text-white"
                                    : "border-neutral-300 bg-neutral-50 text-neutral-700"
                                }`}
                              >
                                <span className="text-[9px] font-semibold opacity-60">
                                  {measureOption.label}
                                </span>
                                <span className="truncate text-[11px] font-semibold">
                                  {measureOption.size}
                                </span>
                              </span>
                            ))}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void runStockAction(() =>
                        markProductsAvailable(
                          filteredProducts.map((product) => product.id),
                        ),
                      );
                    }}
                    disabled={filteredProducts.length === 0}
                    className="h-10 border border-[#1f6f65] bg-white px-4 text-sm font-semibold text-[#185950] transition hover:bg-[#1f6f65] hover:text-white disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-300"
                  >
                    Marcar visibles con stock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void runStockAction(() =>
                        markProductsUnavailable(
                          filteredProducts.map((product) => product.id),
                        ),
                      );
                    }}
                    disabled={filteredProducts.length === 0}
                    className="h-10 border border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-300"
                  >
                    Marcar visibles sin stock
                  </button>
                </div>

                <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {filteredProducts.map((product) => (
                    <AdminProductCard
                      key={product.id}
                      product={product}
                      onAvailabilityChange={(available) =>
                        runStockAction(() =>
                          setProductAvailability(product.id, available),
                        )
                      }
                    />
                  ))}
                </section>

                {filteredProducts.length === 0 ? (
                  <div className="border border-dashed border-neutral-300 px-6 py-10 text-center">
                    <p className="text-sm font-medium text-neutral-500">
                      No hay cuadros con esos filtros.
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-neutral-500">
                      Supabase
                    </p>
                    <h2 className="text-xl font-semibold">
                      Pedidos recibidos
                    </h2>
                  </div>
                  <p className="text-sm font-semibold text-neutral-500">
                    {orders.length} registros
                  </p>
                </div>

                {ordersError ? (
                  <div className="mb-3 border border-red-200 bg-red-50 p-3">
                    <p className="text-sm font-semibold text-red-700">
                      {ordersError}
                    </p>
                  </div>
                ) : null}

                {orders.length > 0 ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {orders.map((order) => (
                      <AdminOrderCard
                        key={order.id}
                        order={order}
                        deleting={deletingOrderId === order.id}
                        updating={updatingOrderId === order.id}
                        onDelete={() => deleteOrder(order.id)}
                        onStatusChange={(status) =>
                          updateOrderStatus(order.id, status)
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-neutral-300 px-6 py-8 text-center">
                    <p className="text-sm font-medium text-neutral-500">
                      Todavia no hay pedidos recibidos.
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block space-y-2 text-sm font-semibold text-neutral-700">
              Clave
              <input
                type="password"
                inputMode="numeric"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                className="h-12 w-full border border-neutral-300 px-3 text-base text-neutral-950 outline-none transition focus:border-neutral-950"
                autoFocus
              />
            </label>

            {error ? (
              <p className="text-sm font-medium text-red-600">{error}</p>
            ) : null}

            <button
              type="submit"
              className="h-11 w-full bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Activar admin
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function AdminLoadingState() {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3">
      <span
        aria-hidden="true"
        className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950"
      />
      <p className="text-sm font-semibold text-neutral-500">
        Verificando acceso...
      </p>
    </div>
  );
}

type SummaryBoxProps = {
  label: string;
  value: number;
};

type AdminOrderCardProps = {
  deleting: boolean;
  order: CustomerOrder;
  onDelete: () => Promise<unknown>;
  updating: boolean;
  onStatusChange: (status: OrderStatus) => Promise<unknown>;
};

const orderDateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatOrderDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return orderDateFormatter.format(date);
}

function formatMoney(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}

function getShortOrderId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function getWhatsappHref(value: string) {
  const phone = value.replace(/\D/g, "");

  return phone ? `https://wa.me/${phone}` : "";
}

function AdminOrderCard({
  deleting,
  order,
  onDelete,
  updating,
  onStatusChange,
}: AdminOrderCardProps) {
  const whatsappHref = getWhatsappHref(order.whatsapp);

  function handleDelete() {
    const confirmed = window.confirm(
      `Vas a borrar el pedido #${getShortOrderId(order.id)}. Esta accion no se puede deshacer. Queres continuar?`,
    );

    if (confirmed) {
      void onDelete();
    }
  }

  return (
    <article className="border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-neutral-500">
            #{getShortOrderId(order.id)} - {formatOrderDate(order.createdAt)}
          </p>
          <h3 className="mt-1 truncate text-base font-semibold">
            {order.customerName || "Sin nombre"}
          </h3>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#1f6f65] underline-offset-4 hover:underline"
              >
                {order.whatsapp}
              </a>
            ) : (
              <span>{order.whatsapp || "Sin WhatsApp"}</span>
            )}
            {order.businessName ? <span>{order.businessName}</span> : null}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span className="inline-flex border border-[#1f6f65]/30 bg-[#1f6f65]/10 px-2 py-1 text-xs font-semibold text-[#185950]">
            {orderStatusLabels[order.status]}
          </span>
          <p className="mt-2 text-sm font-semibold">
            {formatMoney(order.total)}
          </p>
          <p className="text-xs text-neutral-500">
            {order.items.length} cuadros
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-1 border-t border-neutral-100 pt-3">
        {order.items.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="grid grid-cols-[1fr_auto] gap-2 border border-neutral-100 px-2 py-1.5 text-xs"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {item.code} - {item.name}
              </p>
              <p className="truncate text-neutral-500">
                {item.size} - {item.backgroundLabel}
              </p>
            </div>
            <span className="font-semibold">{formatMoney(item.price)}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/compartir?pedido=${encodeURIComponent(order.id)}`}
          target="_blank"
          className="border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:border-neutral-950"
        >
          Abrir pedido
        </Link>
        <Link
          href={`/planilla?pedido=${encodeURIComponent(order.id)}&from=admin`}
          target="_blank"
          className="bg-neutral-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
        >
          Planilla
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting || updating}
          className="border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-300"
        >
          {deleting ? "Borrando..." : "Borrar pedido"}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
        {orderStatuses.map((status) => {
          const active = order.status === status.id;

          return (
            <button
              key={status.id}
              type="button"
              onClick={() => {
                void onStatusChange(status.id);
              }}
              disabled={active || updating}
              className={`min-h-9 border px-2 text-[11px] font-semibold transition ${
                active
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-950"
              } disabled:cursor-not-allowed`}
            >
              {status.label}
            </button>
          );
        })}
      </div>
    </article>
  );
}

function SummaryBox({ label, value }: SummaryBoxProps) {
  return (
    <div className="border border-neutral-200 p-3">
      <p className="text-xs font-semibold uppercase text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

type AdminProductCardProps = {
  product: Product;
  onAvailabilityChange: (available: boolean) => Promise<unknown>;
};

function AdminProductCard({
  product,
  onAvailabilityChange,
}: AdminProductCardProps) {
  return (
    <article
      className={`border bg-white p-3 shadow-sm ${
        product.available
          ? "border-neutral-200"
          : "border-neutral-300 opacity-60 grayscale"
      }`}
    >
      <div className="relative bg-[#efede8] p-2">
        <FramePreview product={product} />
        <span
          className={`absolute left-3 top-3 z-30 px-2 py-1 text-[11px] font-semibold text-white ${
            product.available ? "bg-[#1f6f65]" : "bg-neutral-950"
          }`}
        >
          {product.available ? "Stock" : "Sin stock"}
        </span>
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
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              void onAvailabilityChange(true);
            }}
            disabled={product.available}
            className="h-10 border border-[#1f6f65] bg-white px-2 text-xs font-semibold text-[#185950] transition hover:bg-[#1f6f65] hover:text-white disabled:cursor-not-allowed disabled:bg-[#1f6f65] disabled:text-white"
          >
            Con stock
          </button>
          <button
            type="button"
            onClick={() => {
              void onAvailabilityChange(false);
            }}
            disabled={!product.available}
            className="h-10 border border-neutral-950 bg-white px-2 text-xs font-semibold text-neutral-950 transition hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:bg-neutral-950 disabled:text-white"
          >
            Sin stock
          </button>
        </div>
      </div>
    </article>
  );
}
