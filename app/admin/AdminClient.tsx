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
import { products, type Product } from "@/data/products";

const allStockStates = "todos";
type AdminView = "stock" | "pedidos";

export function AdminClient() {
  const { isAdmin, loginAdmin, logoutAdmin } = useAdminMode();
  const {
    markProductsAvailable,
    markProductsUnavailable,
    setProductAvailability,
    unavailableProductIds,
  } = useLocalStock();
  const { orders } = useFinishedOrders();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stockState, setStockState] = useState(allStockStates);
  const [adminView, setAdminView] = useState<AdminView>("stock");
  const productsWithLocalStock = applyLocalStock(products, unavailableProductIds);
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

    return matchesSearch && matchesStockState;
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

        {isAdmin ? (
          <div className="mt-5 space-y-5">
            <div className="border border-[#1f6f65] bg-[#1f6f65]/10 p-3">
              <p className="text-sm font-semibold text-[#185950]">
                Modo admin activo en este navegador.
              </p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Podes imprimir, terminar pedidos y administrar el stock manual.
              </p>
            </div>

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

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      markProductsAvailable(
                        filteredProducts.map((product) => product.id),
                      )
                    }
                    disabled={filteredProducts.length === 0}
                    className="h-10 border border-[#1f6f65] bg-white px-4 text-sm font-semibold text-[#185950] transition hover:bg-[#1f6f65] hover:text-white disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-300"
                  >
                    Marcar visibles con stock
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      markProductsUnavailable(
                        filteredProducts.map((product) => product.id),
                      )
                    }
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
                        setProductAvailability(product.id, available)
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
                      Logs
                    </p>
                    <h2 className="text-xl font-semibold">
                      Pedidos terminados
                    </h2>
                  </div>
                  <p className="text-sm font-semibold text-neutral-500">
                    {orders.length} registros
                  </p>
                </div>

                {orders.length > 0 ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {orders.map((order) => (
                      <article
                        key={order.id}
                        className="border border-neutral-200 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase text-neutral-500">
                              {new Intl.DateTimeFormat("es-AR", {
                                dateStyle: "short",
                                timeStyle: "short",
                              }).format(new Date(order.createdAt))}
                            </p>
                            <h3 className="mt-1 text-sm font-semibold">
                              {order.productCodes.join(", ")}
                            </h3>
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-neutral-950">
                            {order.productIds.length} cuadros
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link
                            href={order.sharePath}
                            className="border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:border-neutral-950"
                          >
                            Abrir pedido
                          </Link>
                          <Link
                            href={`/planilla${order.sharePath.includes("?") ? order.sharePath.slice(order.sharePath.indexOf("?")) : ""}`}
                            target="_blank"
                            className="bg-neutral-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
                          >
                            Planilla
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-neutral-300 px-6 py-8 text-center">
                    <p className="text-sm font-medium text-neutral-500">
                      Todavia no hay pedidos terminados.
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

type SummaryBoxProps = {
  label: string;
  value: number;
};

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
  onAvailabilityChange: (available: boolean) => void;
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
          className={`absolute left-3 top-3 px-2 py-1 text-[11px] font-semibold text-white ${
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
            onClick={() => onAvailabilityChange(true)}
            disabled={product.available}
            className="h-10 border border-[#1f6f65] bg-white px-2 text-xs font-semibold text-[#185950] transition hover:bg-[#1f6f65] hover:text-white disabled:cursor-not-allowed disabled:bg-[#1f6f65] disabled:text-white"
          >
            Con stock
          </button>
          <button
            type="button"
            onClick={() => onAvailabilityChange(false)}
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
