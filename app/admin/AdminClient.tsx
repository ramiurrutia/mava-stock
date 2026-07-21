"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { FramePreview } from "@/components/FramePreview";
import {
  notifyCatalogProductsChanged,
  useCatalogProducts,
} from "@/components/useCatalogProducts";
import {
  applyLocalStock,
  createAdminProduct,
  deleteAdminProduct,
  editAdminProduct,
  saveAdminProductOrder,
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
import {
  getProductPriceOptions,
  orderProductsByManualOrder,
  productFolders,
  type Product,
  type ProductMeasureCode,
} from "@/data/products";
import { BsArrowsMove } from "react-icons/bs";

const allStockStates = "todos";
const allFolders = "todas";
const recentlyAddedProductCodeKey = "mava-recently-added-product-code";
const recentlyAddedDurationMs = 24 * 60 * 60 * 1000;
type AdminView = "stock" | "pedidos";
type NewProductPriceMode = "base" | "blanco" | "arpillera" | "ambos";

const defaultNewProductMeasureCode: ProductMeasureCode = "XG";
const defaultNewProductPriceMode: NewProductPriceMode = "ambos";
const newProductMeasureOptions = productFolders.flatMap((folder) =>
  folder.measures.map((measure) => ({
    ...measure,
    folderLabel: folder.label,
  })),
);
const defaultPricesByMeasureCode: Record<
  ProductMeasureCode,
  {
    arpillera: string;
    base: string;
    blanco: string;
  }
> = {
  DNG: {
    arpillera: "95",
    base: "87",
    blanco: "87",
  },
  SG: {
    arpillera: "320",
    base: "320",
    blanco: "320",
  },
  SGF: {
    arpillera: "249",
    base: "249",
    blanco: "249",
  },
  TC: {
    arpillera: "45",
    base: "45",
    blanco: "45",
  },
  TEXTURADO: {
    arpillera: "165",
    base: "165",
    blanco: "165",
  },
  XG: {
    arpillera: "142",
    base: "129",
    blanco: "129",
  },
  XGM: {
    arpillera: "142",
    base: "129",
    blanco: "129",
  },
};

function getProductPriceMode(product: Product): NewProductPriceMode {
  const optionIds = new Set(
    getProductPriceOptions(product).map((option) => option.id),
  );

  if (optionIds.has("base")) {
    return "base";
  }

  if (optionIds.has("blanco") && optionIds.has("arpillera")) {
    return "ambos";
  }

  if (optionIds.has("arpillera")) {
    return "arpillera";
  }

  return "blanco";
}

function getProductPriceDefault(
  product: Product,
  priceId: "arpillera" | "base" | "blanco",
) {
  const option = getProductPriceOptions(product).find(
    (item) => item.id === priceId,
  );

  return String(option?.amountInThousands ?? "");
}

function readRecentlyAddedProductCode() {
  const value = window.localStorage.getItem(recentlyAddedProductCodeKey);

  if (!value) {
    return "";
  }

  try {
    const parsed = JSON.parse(value) as {
      code?: unknown;
      expiresAt?: unknown;
    };
    const code = typeof parsed.code === "string" ? parsed.code : "";
    const expiresAt =
      typeof parsed.expiresAt === "number" ? parsed.expiresAt : 0;

    if (!code || expiresAt <= Date.now()) {
      window.localStorage.removeItem(recentlyAddedProductCodeKey);
      return "";
    }

    return code;
  } catch {
    window.localStorage.removeItem(recentlyAddedProductCodeKey);
    return "";
  }
}

function writeRecentlyAddedProductCode(code: string) {
  window.localStorage.setItem(
    recentlyAddedProductCodeKey,
    JSON.stringify({
      code,
      expiresAt: Date.now() + recentlyAddedDurationMs,
    }),
  );
}

export function AdminClient() {
  const { checkingAdmin, isAdmin, loginAdmin, logoutAdmin } = useAdminMode();
  const {
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
  const [stockingOrderId, setStockingOrderId] = useState("");
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [addProductMessage, setAddProductMessage] = useState("");
  const [deletingProductCode, setDeletingProductCode] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingProductCode, setEditingProductCode] = useState("");
  const [orderMode, setOrderMode] = useState(false);
  const [orderingProducts, setOrderingProducts] = useState<Product[]>([]);
  const [savingProductOrder, setSavingProductOrder] = useState(false);
  const [deletedProductCodes, setDeletedProductCodes] = useState<Set<string>>(
    () => new Set(),
  );
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [recentlyAddedProductCode, setRecentlyAddedProductCode] = useState("");
  const [newProductMeasureCode, setNewProductMeasureCode] =
    useState<ProductMeasureCode>(defaultNewProductMeasureCode);
  const [newProductPriceMode, setNewProductPriceMode] =
    useState<NewProductPriceMode>(defaultNewProductPriceMode);
  const catalogProducts = useCatalogProducts(adminProducts);
  const visibleCatalogProducts = catalogProducts.filter(
    (product) => !deletedProductCodes.has(product.code),
  );
  const productsWithLocalStock = applyLocalStock(
    visibleCatalogProducts,
    unavailableProductIds,
  );
  const activeFolder = productFolders.find((item) => item.id === folder);
  const normalizedSearch = search.trim().toLowerCase();
  const availableCount = productsWithLocalStock.filter(
    (product) => product.available,
  ).length;
  const unavailableCount = productsWithLocalStock.length - availableCount;
  const filteredProducts = orderProductsByManualOrder(
    productsWithLocalStock.filter((product) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.code.toLowerCase().includes(normalizedSearch) ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch) ||
        product.size.toLowerCase().includes(normalizedSearch) ||
        Boolean(product.pairLabel?.toLowerCase().includes(normalizedSearch)) ||
        Boolean(
          product.pairRelatedCodes?.some((code) =>
            code.toLowerCase().includes(normalizedSearch),
          ),
        );
      const matchesStockState =
        stockState === allStockStates ||
        (stockState === "stock" && product.available) ||
        (stockState === "sin-stock" && !product.available);
      const matchesFolder =
        folder === allFolders || product.folderId === folder;

      return matchesSearch && matchesStockState && matchesFolder;
    }),
  );
  const visibleAdminProducts = orderMode ? orderingProducts : filteredProducts;
  const sortableProductCodes = visibleAdminProducts.map(
    (product) => product.code,
  );
  const dragSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setRecentlyAddedProductCode(readRecentlyAddedProductCode());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

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

  async function removeOrderFromStock(order: CustomerOrder) {
    const productIds = Array.from(
      new Set(order.items.map((item) => item.id).filter(Boolean)),
    );

    if (productIds.length === 0) {
      return;
    }

    setStockingOrderId(order.id);

    try {
      await runStockAction(() => markProductsUnavailable(productIds));
    } finally {
      setStockingOrderId("");
    }
  }

  async function handleAddProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setActionError("");
    setAddProductMessage("");
    setAddingProduct(true);

    try {
      const response = await createAdminProduct(new FormData(form));
      const addedProduct = response.product;
      const code = addedProduct?.code ?? "nuevo item";

      form.reset();
      setNewProductMeasureCode(defaultNewProductMeasureCode);
      setNewProductPriceMode(defaultNewProductPriceMode);
      if (addedProduct) {
        setDeletedProductCodes((current) => {
          const next = new Set(current);
          next.delete(addedProduct.code);

          return next;
        });
        setAdminProducts((current) => [
          ...current.filter((product) => product.code !== addedProduct.code),
          addedProduct,
        ]);
        notifyCatalogProductsChanged();
      }
      writeRecentlyAddedProductCode(code);
      setRecentlyAddedProductCode(code);
      setAddProductMessage(`Se agrego ${code}.`);
      setAddProductOpen(false);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "No se pudo agregar el item",
      );
    } finally {
      setAddingProduct(false);
    }
  }

  async function handleDeleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Vas a borrar ${product.code} del catalogo y del storage. Esta accion no se puede deshacer. Queres continuar?`,
    );

    if (!confirmed) {
      return;
    }

    setActionError("");
    setDeletingProductCode(product.code);

    try {
      await deleteAdminProduct(product.code);
      if (product.code === recentlyAddedProductCode) {
        window.localStorage.removeItem(recentlyAddedProductCodeKey);
        setRecentlyAddedProductCode("");
      }
      setAdminProducts((current) =>
        current.filter((item) => item.code !== product.code),
      );
      setDeletedProductCodes((current) => {
        const next = new Set(current);
        next.add(product.code);

        return next;
      });
      notifyCatalogProductsChanged();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "No se pudo borrar el item",
      );
    } finally {
      setDeletingProductCode("");
    }
  }

  async function handleEditProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setActionError("");
    setAddProductMessage("");
    setEditingProductCode(editingProduct?.code ?? "");

    try {
      const response = await editAdminProduct(new FormData(form));
      const updatedProduct = response.product;
      const previousCode = response.previousCode ?? editingProduct?.code;

      if (!updatedProduct) {
        throw new Error("No se pudo editar el item");
      }

      setDeletedProductCodes((current) => {
        const next = new Set(current);
        next.delete(updatedProduct.code);

        if (previousCode && previousCode !== updatedProduct.code) {
          next.add(previousCode);
        }

        return next;
      });
      setAdminProducts((current) => [
        ...current.filter(
          (product) =>
            product.code !== updatedProduct.code &&
            product.code !== previousCode,
        ),
        updatedProduct,
      ]);

      if (previousCode && previousCode === recentlyAddedProductCode) {
        writeRecentlyAddedProductCode(updatedProduct.code);
        setRecentlyAddedProductCode(updatedProduct.code);
      }

      notifyCatalogProductsChanged();
      setAddProductMessage(`Se edito ${updatedProduct.code}.`);
      setEditingProduct(null);
      form.reset();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "No se pudo editar el item",
      );
    } finally {
      setEditingProductCode("");
    }
  }

  function startProductOrderMode() {
    setOrderingProducts(filteredProducts);
    setOrderMode(true);
    setActionError("");
    setAddProductMessage("");
  }

  function cancelProductOrderMode() {
    setOrderMode(false);
    setOrderingProducts([]);
  }

  function handleProductDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeCode = String(active.id);
    const overCode = over ? String(over.id) : "";

    if (!overCode || activeCode === overCode) {
      return;
    }

    setOrderingProducts((current) => {
      const oldIndex = current.findIndex(
        (product) => product.code === activeCode,
      );
      const newIndex = current.findIndex(
        (product) => product.code === overCode,
      );

      if (oldIndex < 0 || newIndex < 0) {
        return current;
      }

      return arrayMove(current, oldIndex, newIndex);
    });
  }

  async function handleSaveProductOrder() {
    setActionError("");
    setSavingProductOrder(true);

    try {
      await saveAdminProductOrder(orderingProducts.map((product) => product.code));
      notifyCatalogProductsChanged();
      setAddProductMessage("Se guardo el orden del catalogo.");
      setOrderMode(false);
      setOrderingProducts([]);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "No se pudo guardar el orden",
      );
    } finally {
      setSavingProductOrder(false);
    }
  }

  function scrollAdminToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function scrollAdminToBottom() {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
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
            <div className="border border-[#7E5E35] bg-[#7E5E35]/10 p-3">
              <p className="text-sm font-semibold text-[#5F4627]">
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

            {addProductMessage ? (
              <div
                className="flex flex-col gap-3 border border-[#7E5E35]/30 bg-[#7E5E35]/10 p-3 sm:flex-row sm:items-center sm:justify-between"
                role="status"
                aria-live="polite"
              >
                <p className="text-sm font-semibold text-[#5F4627]">
                  {addProductMessage}
                </p>
                <button
                  type="button"
                  onClick={() => setAddProductMessage("")}
                  className="h-9 border border-[#7E5E35]/30 bg-white px-3 text-xs font-semibold text-[#5F4627] transition hover:border-[#7E5E35]"
                >
                  Cerrar
                </button>
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
                <AddProductPanel
                  adding={addingProduct}
                  message={addProductMessage}
                  measureCode={newProductMeasureCode}
                  onMeasureCodeChange={setNewProductMeasureCode}
                  onOpenChange={setAddProductOpen}
                  onPriceModeChange={setNewProductPriceMode}
                  onSubmit={handleAddProduct}
                  open={addProductOpen}
                  priceMode={newProductPriceMode}
                />

                {editingProduct ? (
                  <EditProductPanel
                    key={editingProduct.code}
                    editing={editingProductCode === editingProduct.code}
                    onClose={() => setEditingProduct(null)}
                    onSubmit={handleEditProduct}
                    product={editingProduct}
                  />
                ) : null}

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
                      className={`min-h-18 min-w-0 border px-2.5 py-2 text-left transition sm:px-3 ${
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
                          className={`min-h-18 min-w-0 border px-2.5 py-2 text-left transition sm:px-3 ${
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

                <div className="flex flex-col gap-3 border border-neutral-200 bg-neutral-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-neutral-950">
                      Orden manual del catalogo
                    </p>
                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                      Ordena los cuadros visibles y guardalos para que se vean
                      asi en el catalogo.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {orderMode ? (
                      <>
                        <button
                          type="button"
                          onClick={cancelProductOrderMode}
                          disabled={savingProductOrder}
                          className="h-10 border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-950 disabled:cursor-not-allowed disabled:text-neutral-300"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void handleSaveProductOrder();
                          }}
                          disabled={savingProductOrder}
                          className="h-10 bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                        >
                          {savingProductOrder ? "Guardando..." : "Guardar orden"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={startProductOrderMode}
                        disabled={filteredProducts.length < 2}
                        className="h-10 border border-neutral-950 bg-white px-4 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-300"
                      >
                        Ordenar visible
                      </button>
                    )}
                  </div>
                </div>

                {orderMode ? (
                  <DndContext
                    sensors={dragSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleProductDragEnd}
                  >
                    <SortableContext
                      items={sortableProductCodes}
                      strategy={rectSortingStrategy}
                    >
                      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {visibleAdminProducts.map((product) => (
                          <SortableAdminProductCard
                            key={product.id}
                            product={product}
                            deleting={deletingProductCode === product.code}
                            recentlyAdded={
                              product.code === recentlyAddedProductCode
                            }
                            onAvailabilityChange={(available) =>
                              runStockAction(() =>
                                setProductAvailability(product.id, available),
                              )
                            }
                            onDelete={() => handleDeleteProduct(product)}
                            onEdit={
                              product.dynamic
                                ? () => setEditingProduct(product)
                                : undefined
                            }
                          />
                        ))}
                      </section>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {visibleAdminProducts.map((product) => (
                      <AdminProductCard
                        key={product.id}
                        product={product}
                        deleting={deletingProductCode === product.code}
                        recentlyAdded={
                          product.code === recentlyAddedProductCode
                        }
                        onAvailabilityChange={(available) =>
                          runStockAction(() =>
                            setProductAvailability(product.id, available),
                          )
                        }
                        onDelete={() => handleDeleteProduct(product)}
                        onEdit={
                          product.dynamic
                            ? () => setEditingProduct(product)
                            : undefined
                        }
                      />
                    ))}
                  </section>
                )}

                {visibleAdminProducts.length === 0 ? (
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
                    <h2 className="text-xl font-semibold">Pedidos recibidos</h2>
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
                        removingFromStock={stockingOrderId === order.id}
                        updating={updatingOrderId === order.id}
                        onDelete={() => deleteOrder(order.id)}
                        onRemoveFromStock={() => removeOrderFromStock(order)}
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

      {isAdmin ? (
        <div className="fixed bottom-5 right-4 z-70 grid gap-2 sm:bottom-6 sm:right-6">
          <button
            type="button"
            onClick={scrollAdminToTop}
            aria-label="Subir al inicio"
            title="Subir al inicio"
            className="flex h-11 w-11 items-center justify-center border border-neutral-950 bg-white text-xl font-semibold leading-none text-neutral-950 shadow-[0_10px_28px_rgba(0,0,0,0.18)] transition hover:bg-neutral-950 hover:text-white active:translate-y-0.5"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={scrollAdminToBottom}
            aria-label="Bajar al final"
            title="Bajar al final"
            className="flex h-11 w-11 items-center justify-center border border-neutral-950 bg-white text-xl font-semibold leading-none text-neutral-950 shadow-[0_10px_28px_rgba(0,0,0,0.18)] transition hover:bg-neutral-950 hover:text-white active:translate-y-0.5"
          >
            ↓
          </button>
        </div>
      ) : null}
    </main>
  );
}

type AddProductPanelProps = {
  adding: boolean;
  measureCode: ProductMeasureCode;
  message: string;
  onMeasureCodeChange: (measureCode: ProductMeasureCode) => void;
  onOpenChange: (open: boolean) => void;
  onPriceModeChange: (priceMode: NewProductPriceMode) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  open: boolean;
  priceMode: NewProductPriceMode;
};

function AddProductPanel({
  adding,
  measureCode,
  message,
  onMeasureCodeChange,
  onOpenChange,
  onPriceModeChange,
  onSubmit,
  open,
  priceMode,
}: AddProductPanelProps) {
  const defaultPrices = defaultPricesByMeasureCode[measureCode];

  return (
    <section className="border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase text-neutral-500">
            Catalogo
          </p>
          <h2 className="text-lg font-semibold">Agregar item</h2>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          className="h-10 border border-neutral-950 bg-white px-4 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-950 hover:text-white"
        >
          {open ? "Cerrar" : "Agregar item"}
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-80 flex items-center justify-center bg-neutral-950/55 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-product-title"
        >
          <form
            onSubmit={onSubmit}
            className="max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-y-auto border border-neutral-200 bg-white p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-5"
          >
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-neutral-200 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase text-[#7E5E35]">
                  Catalogo
                </p>
                <h3
                  id="add-product-title"
                  className="mt-1 text-xl font-semibold"
                >
                  Agregar item
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Subi la imagen, elegi la medida y defini el precio.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-10 shrink-0 border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-neutral-700">
                  Imagen
                  <input
                    name="image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required
                    className="block w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 file:mr-3 file:border-0 file:bg-neutral-950 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                  />
                </label>

                <label className="space-y-2 text-sm font-semibold text-neutral-700">
                  Medida
                  <select
                    name="measureCode"
                    value={measureCode}
                    onChange={(event) =>
                      onMeasureCodeChange(
                        event.target.value as ProductMeasureCode,
                      )
                    }
                    className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
                  >
                    {newProductMeasureOptions.map((measure) => (
                      <option key={measure.code} value={measure.code}>
                        {measure.label} {measure.size} - {measure.folderLabel}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <label className="space-y-2 text-sm font-semibold text-neutral-700">
                  Fondo / precio
                  <select
                    name="priceMode"
                    value={priceMode}
                    onChange={(event) =>
                      onPriceModeChange(
                        event.target.value as NewProductPriceMode,
                      )
                    }
                    className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
                  >
                    <option value="ambos">Blanco y arpillera</option>
                    <option value="blanco">Solo blanco</option>
                    <option value="arpillera">Solo arpillera</option>
                    <option value="base">Precio unico</option>
                  </select>
                </label>

                <div
                  className={`grid gap-3 ${
                    priceMode === "ambos" ? "sm:grid-cols-2" : ""
                  }`}
                >
                  {priceMode === "base" ? (
                    <PriceInput
                      key={`${measureCode}-base`}
                      defaultValue={defaultPrices.base}
                      label="Precio unico"
                      name="basePrice"
                    />
                  ) : null}

                  {priceMode === "blanco" || priceMode === "ambos" ? (
                    <PriceInput
                      key={`${measureCode}-blanco`}
                      defaultValue={defaultPrices.blanco}
                      label="Precio blanco"
                      name="blancoPrice"
                    />
                  ) : null}

                  {priceMode === "arpillera" || priceMode === "ambos" ? (
                    <PriceInput
                      key={`${measureCode}-arpillera`}
                      defaultValue={defaultPrices.arpillera}
                      label="Precio arpillera"
                      name="arpilleraPrice"
                    />
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-neutral-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-neutral-500">
                  El codigo se asigna automatico segun la medida elegida.
                </p>
                <button
                  type="submit"
                  disabled={adding}
                  className="h-11 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                  {adding ? "Agregando..." : "Guardar item"}
                </button>
              </div>

              {message ? (
                <p className="border border-[#7E5E35]/20 bg-[#7E5E35]/10 p-3 text-sm font-semibold text-[#5F4627]">
                  {message}
                </p>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

type EditProductPanelProps = {
  editing: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  product: Product;
};

function EditProductPanel({
  editing,
  onClose,
  onSubmit,
  product,
}: EditProductPanelProps) {
  const [measureCode, setMeasureCode] = useState<ProductMeasureCode>(
    product.measureCode,
  );
  const [priceMode, setPriceMode] = useState<NewProductPriceMode>(() =>
    getProductPriceMode(product),
  );
  const defaultPrices = defaultPricesByMeasureCode[measureCode];
  const basePrice = getProductPriceDefault(product, "base");
  const blancoPrice = getProductPriceDefault(product, "blanco");
  const arpilleraPrice = getProductPriceDefault(product, "arpillera");

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-neutral-950/55 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-product-title"
    >
      <form
        onSubmit={onSubmit}
        className="max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto border border-neutral-200 bg-white p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-5"
      >
        <input name="code" type="hidden" value={product.code} readOnly />

        <div className="mb-4 flex items-start justify-between gap-3 border-b border-neutral-200 pb-3">
          <div>
            <p className="text-xs font-semibold uppercase text-[#7E5E35]">
              Catalogo
            </p>
            <h3 id="edit-product-title" className="mt-1 text-xl font-semibold">
              Editar {product.code}
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Cambia la medida o los precios sin volver a subir la imagen.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 shrink-0 border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
          >
            Cerrar
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-neutral-700">
            Medida
            <select
              name="measureCode"
              value={measureCode}
              onChange={(event) =>
                setMeasureCode(event.target.value as ProductMeasureCode)
              }
              className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
            >
              {newProductMeasureOptions.map((measure) => (
                <option key={measure.code} value={measure.code}>
                  {measure.label} {measure.size} - {measure.folderLabel}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-neutral-700">
            Fondo / precio
            <select
              name="priceMode"
              value={priceMode}
              onChange={(event) =>
                setPriceMode(event.target.value as NewProductPriceMode)
              }
              className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
            >
              <option value="ambos">Blanco y arpillera</option>
              <option value="blanco">Solo blanco</option>
              <option value="arpillera">Solo arpillera</option>
              <option value="base">Precio unico</option>
            </select>
          </label>
        </div>

        <div
          className={`mt-4 grid gap-3 ${
            priceMode === "ambos" ? "sm:grid-cols-2" : ""
          }`}
        >
          {priceMode === "base" ? (
            <PriceInput
              key={`${product.code}-${measureCode}-base`}
              defaultValue={basePrice || defaultPrices.base}
              label="Precio unico"
              name="basePrice"
            />
          ) : null}

          {priceMode === "blanco" || priceMode === "ambos" ? (
            <PriceInput
              key={`${product.code}-${measureCode}-blanco`}
              defaultValue={blancoPrice || defaultPrices.blanco}
              label="Precio blanco"
              name="blancoPrice"
            />
          ) : null}

          {priceMode === "arpillera" || priceMode === "ambos" ? (
            <PriceInput
              key={`${product.code}-${measureCode}-arpillera`}
              defaultValue={arpilleraPrice || defaultPrices.arpillera}
              label="Precio arpillera"
              name="arpilleraPrice"
            />
          ) : null}
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-neutral-500">
            Si cambias la medida, se mueve en storage y se reasigna el codigo.
          </p>
          <button
            type="submit"
            disabled={editing}
            className="h-11 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {editing ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

type PriceInputProps = {
  defaultValue: string;
  label: string;
  name: string;
};

function PriceInput({ defaultValue, label, name }: PriceInputProps) {
  return (
    <label className="space-y-2 text-sm font-semibold text-neutral-700">
      {label}
      <div className="grid grid-cols-[auto_1fr_auto] border border-neutral-300 bg-white focus-within:border-neutral-950">
        <span className="flex h-11 items-center px-3 text-sm font-semibold text-neutral-500">
          $
        </span>
        <input
          name={name}
          type="number"
          min="1"
          step="1"
          defaultValue={defaultValue}
          required
          className="h-11 min-w-0 bg-transparent text-sm font-semibold text-neutral-950 outline-none"
        />
        <span className="flex h-11 items-center px-3 text-sm font-semibold text-neutral-500">
          k
        </span>
      </div>
    </label>
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
  onRemoveFromStock: () => Promise<unknown>;
  removingFromStock: boolean;
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
  onRemoveFromStock,
  removingFromStock,
  updating,
  onStatusChange,
}: AdminOrderCardProps) {
  const whatsappHref = getWhatsappHref(order.whatsapp);
  const visibleItems = order.items.slice(0, 3);
  const hiddenItemCount = order.items.length - visibleItems.length;

  function handleDelete() {
    const confirmed = window.confirm(
      `Vas a borrar el pedido #${getShortOrderId(order.id)}. Esta accion no se puede deshacer. Queres continuar?`,
    );

    if (confirmed) {
      void onDelete();
    }
  }

  function handleRemoveFromStock() {
    const confirmed = window.confirm(
      `Vas a marcar sin stock los ${order.items.length} cuadros del pedido #${getShortOrderId(order.id)}. Queres continuar?`,
    );

    if (confirmed) {
      void onRemoveFromStock();
    }
  }

  return (
    <article className="flex h-95 flex-col overflow-hidden border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="flex shrink-0 items-start justify-between gap-3">
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
                className="font-semibold text-[#7E5E35] underline-offset-4 hover:underline"
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
          <span className="inline-flex border border-[#7E5E35]/30 bg-[#7E5E35]/10 px-2 py-1 text-xs font-semibold text-[#5F4627]">
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

      <div className="mt-3 shrink-0 space-y-1 border-t border-neutral-100 pt-3">
        {visibleItems.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="grid grid-cols-[1fr_auto] gap-2 border border-neutral-100 px-2 py-1.5 text-xs"
          >
            <div className="min-w-0">
              <p className="truncate font-mono font-semibold uppercase">
                {item.code}
              </p>
              <p className="truncate text-neutral-500">
                {item.size} - {item.backgroundLabel}
              </p>
            </div>
            <span className="font-semibold">{formatMoney(item.price)}</span>
          </div>
        ))}
        {hiddenItemCount > 0 ? (
          <div className="border border-dashed border-neutral-200 bg-neutral-50 px-2 py-1.5 text-xs font-semibold text-neutral-500">
            +{hiddenItemCount} items
          </div>
        ) : null}
      </div>

      <div className="mt-auto space-y-3 pt-3">
        <div className="flex flex-wrap gap-2">
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
            onClick={handleRemoveFromStock}
            disabled={deleting || updating || removingFromStock}
            className="border border-neutral-950 bg-neutral-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-300"
          >
            {removingFromStock ? "Sacando..." : "Sacar de stock"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || updating || removingFromStock}
            className="border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-300"
          >
            {deleting ? "Borrando..." : "Borrar pedido"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
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
      </div>
    </article>
  );
}

function SummaryBox({ label, value }: SummaryBoxProps) {
  return (
    <div className="border border-neutral-200 p-3">
      <p className="text-xs font-semibold uppercase text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

type AdminProductCardProps = {
  deleting: boolean;
  dragging?: boolean;
  product: Product;
  recentlyAdded: boolean;
  onAvailabilityChange: (available: boolean) => Promise<unknown>;
  onDelete?: () => Promise<unknown>;
  onEdit?: () => void;
  dragCardProps?: React.HTMLAttributes<HTMLElement>;
};

function SortableAdminProductCard(props: AdminProductCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.product.code,
  });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <AdminProductCard
        {...props}
        dragging={isDragging}
        dragCardProps={{
          ...attributes,
          ...listeners,
        }}
      />
    </div>
  );
}

function AdminProductCard({
  deleting,
  dragging = false,
  product,
  recentlyAdded,
  onAvailabilityChange,
  onDelete,
  onEdit,
  dragCardProps,
}: AdminProductCardProps) {
  const pairKind = product.pairSize && product.pairSize > 2 ? "Serie" : "Pareja";
  const pairText = product.pairRelatedCodes?.length
    ? `${pairKind} con ${product.pairRelatedCodes.join(", ")}`
    : product.pairLabel;

  return (
    <article
      {...dragCardProps}
      className={`relative border bg-white p-3 shadow-sm transition ${
        product.available
          ? "border-neutral-200"
          : "border-neutral-300 opacity-60 grayscale"
      } ${
        dragCardProps
          ? "group/order cursor-grab select-none touch-none overflow-hidden hover:border-[#7E5E35] hover:shadow-md active:cursor-grabbing"
          : ""
      } ${
        dragging ? "scale-[0.98] border-[#7E5E35] opacity-55" : ""
      }`}
    >
      <div className="relative bg-[#efede8] p-2">
        <FramePreview product={product} />
        <span
          className={`absolute left-3 top-3 z-30 px-2 py-1 text-[11px] font-semibold text-white ${
            product.available ? "bg-[#7E5E35]" : "bg-neutral-950"
          }`}
        >
          {product.available ? "Stock" : "Sin stock"}
        </span>
        {product.pairGroupId ? (
          <span className="absolute right-3 top-3 z-30 border border-[#7E5E35]/30 bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase text-[#7E5E35] shadow-sm">
            {pairKind} {product.pairPosition}/{product.pairSize}
          </span>
        ) : null}
      </div>

      <div className="mt-3 space-y-2">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h2 className="flex flex-col font-mono text-sm font-semibold uppercase">
              {product.code}
              {recentlyAdded ? (
                <span className="text-[10px] font-bold uppercase text-[#5F4627]">
                  Nuevo
                </span>
              ) : null}
            </h2>
            {dragCardProps ? (
              <span className="shrink-0 border border-neutral-300 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-neutral-600">
                Mover
              </span>
            ) : null}
          </div>
          {pairText ? (
            <p className="mt-1 truncate text-[11px] font-semibold text-[#7E5E35]">
              {pairText}
            </p>
          ) : null}
        </div>
        <div className="space-y-1 border-t border-neutral-100 pt-3 text-xs">
          <p className="leading-tight text-neutral-500">{product.size}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              void onAvailabilityChange(true);
            }}
            disabled={product.available}
            className="h-10 border border-[#7E5E35] bg-white px-2 text-xs font-semibold text-[#5F4627] transition hover:bg-[#7E5E35] hover:text-white disabled:cursor-not-allowed disabled:bg-[#7E5E35] disabled:text-white"
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
        {onDelete ? (
          <div className={onEdit ? "grid grid-cols-2 gap-2" : ""}>
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="h-8 border border-neutral-300 bg-white px-2 text-xs font-semibold text-neutral-800 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
              >
                Editar
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                void onDelete();
              }}
              disabled={deleting}
              className={`h-8 border border-red-800 bg-red-800/20 px-2 text-xs font-semibold text-red-800 transition hover:border-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400 ${
                onEdit ? "" : "w-full"
              }`}
            >
              {deleting ? "Borrando..." : "Borrar"}
            </button>
          </div>
        ) : null}
      </div>

      {dragCardProps ? (
        <div
          className={`pointer-events-none absolute inset-0 z-40 grid place-items-center bg-neutral-950/55 transition ${
            dragging ? "opacity-100" : "opacity-0 group-hover/order:opacity-100"
          }`}
          aria-hidden="true"
        >
          <div className="grid place-items-center border border-white/40 bg-neutral-950/70 px-4 py-3 text-white shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
            <BsArrowsMove></BsArrowsMove>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide">
              Mover
            </span>
          </div>
        </div>
      ) : null}
    </article>
  );
}
