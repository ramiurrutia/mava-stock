"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CustomerOrder, OrderStatus } from "@/data/orders";
import type { Product } from "@/data/products";
import type {
  CatalogHighlights,
  CatalogHighlightTargetType,
} from "@/lib/catalogHighlights";

const adminModeChangeEvent = "mava-admin-mode-change";
const stockChangeEvent = "mava-stock-change";
const ordersChangeEvent = "mava-orders-change";
const adminKeyStorageKey = "mava-admin-key";

type SessionResponse = {
  authenticated?: boolean;
};

type OrdersResponse = {
  orders?: CustomerOrder[];
};

type OrderResponse = {
  order?: CustomerOrder;
};

type StockResponse = {
  error?: string;
  stockQuantities?: Record<string, number>;
  deductedOrderIds?: string[];
  unavailableProductIds?: string[];
};

type CreateFinishedOrderInput = {
  productIds: string[];
  productCodes: string[];
  selectedPriceIds: Record<string, string | undefined>;
  totalInThousands: number;
  sharePath: string;
};

function normalizeIds(ids?: string[]) {
  return Array.isArray(ids)
    ? ids.filter((id): id is string => typeof id === "string")
    : [];
}

async function fetchStock(admin: boolean) {
  const response = await fetch(admin ? "/api/admin/stock" : "/api/stock", {
    cache: "no-store",
    headers: admin ? getAdminAuthHeaders() : undefined,
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "No se pudo cargar el stock"));
  }

  const data = (await response.json()) as StockResponse;

  return data;
}

function getStoredAdminKey() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(adminKeyStorageKey) ?? "";
}

function getAdminHeaders() {
  return {
    "Content-Type": "application/json",
    "x-mava-admin-key": getStoredAdminKey(),
  };
}

function getAdminAuthHeaders() {
  return {
    "x-mava-admin-key": getStoredAdminKey(),
  };
}

async function getApiErrorMessage(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as
    | { error?: unknown }
    | null;

  return typeof data?.error === "string" ? data.error : fallback;
}

export async function createAdminProduct(formData: FormData) {
  const response = await fetch("/api/admin/products", {
    body: formData,
    headers: getAdminAuthHeaders(),
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "No se pudo agregar el item"),
    );
  }

  return (await response.json()) as {
    product?: Product;
  };
}

export async function deleteAdminProduct(code: string) {
  const response = await fetch(
    `/api/admin/products?code=${encodeURIComponent(code)}`,
    {
      headers: getAdminAuthHeaders(),
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "No se pudo borrar el item"),
    );
  }

  return (await response.json()) as {
    product?: {
      code: string;
    };
  };
}

export async function editAdminProduct(formData: FormData) {
  const response = await fetch("/api/admin/products", {
    body: formData,
    headers: getAdminAuthHeaders(),
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "No se pudo editar el item"),
    );
  }

  return (await response.json()) as {
    previousCode?: string;
    product?: Product;
  };
}

export async function saveAdminProductOrder(codes: string[]) {
  const response = await fetch("/api/admin/product-order", {
    body: JSON.stringify({ codes }),
    headers: getAdminHeaders(),
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "No se pudo guardar el orden"),
    );
  }

  return (await response.json()) as {
    codes?: string[];
  };
}

export async function setAdminCatalogHighlight(input: {
  highlighted: boolean;
  targetId: string;
  targetType: CatalogHighlightTargetType;
}) {
  const response = await fetch("/api/admin/highlights", {
    body: JSON.stringify(input),
    headers: getAdminHeaders(),
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(
        response,
        "No se pudo actualizar Lo mas vendido",
      ),
    );
  }

  return (await response.json()) as {
    highlights?: CatalogHighlights;
  };
}

export function applyLocalStock(
  productList: Product[],
  unavailableProductIds: string[],
) {
  const unavailableSet = new Set(unavailableProductIds);

  return productList.map((product) => ({
    ...product,
    available: product.available && !unavailableSet.has(product.id),
  }));
}

export function useAdminMode() {
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    async function refreshAdminMode() {
      const storedAdminKey = getStoredAdminKey();

      if (!storedAdminKey) {
        if (active) {
          setIsAdmin(false);
          setCheckingAdmin(false);
        }
        return;
      }

      setCheckingAdmin(true);

      try {
        const response = await fetch("/api/admin/session", {
          cache: "no-store",
          headers: {
            "x-mava-admin-key": storedAdminKey,
          },
        });

        if (!active) {
          return;
        }

        if (!response.ok) {
          setIsAdmin(false);
          return;
        }

        const data = (await response.json()) as SessionResponse;
        setIsAdmin(Boolean(data.authenticated));
      } catch {
        if (active) {
          setIsAdmin(false);
        }
      } finally {
        if (active) {
          setCheckingAdmin(false);
        }
      }
    }

    refreshAdminMode();
    window.addEventListener(adminModeChangeEvent, refreshAdminMode);

    return () => {
      active = false;
      window.removeEventListener(adminModeChangeEvent, refreshAdminMode);
    };
  }, []);

  const loginAdmin = useCallback(async (password: string) => {
    setCheckingAdmin(true);

    try {
      const response = await fetch("/api/admin/session", {
        body: JSON.stringify({ password }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        setIsAdmin(false);
        window.dispatchEvent(new Event(adminModeChangeEvent));
        return false;
      }

      window.localStorage.setItem(adminKeyStorageKey, password);
      setIsAdmin(true);
      window.dispatchEvent(new Event(adminModeChangeEvent));
      return true;
    } finally {
      setCheckingAdmin(false);
    }
  }, []);

  const logoutAdmin = useCallback(async () => {
    window.localStorage.removeItem(adminKeyStorageKey);
    setCheckingAdmin(false);
    setIsAdmin(false);
    window.dispatchEvent(new Event(adminModeChangeEvent));
  }, []);

  return { checkingAdmin, isAdmin, loginAdmin, logoutAdmin };
}

export function useLocalStock({ admin = false }: { admin?: boolean } = {}) {
  const [stockQuantities, setStockQuantities] = useState<Record<string, number>>({});
  const [deductedOrderIds, setDeductedOrderIds] = useState<string[]>([]);
  const [stockLoading, setStockLoading] = useState(true);
  const [stockError, setStockError] = useState("");
  const [unavailableProductIds, setUnavailableProductIds] = useState<string[]>(
    [],
  );

  useEffect(() => {
    let active = true;
    let refreshId = 0;
    async function refreshUnavailableProductIds() {
      const id = ++refreshId;
      setStockLoading(true);
      try {
        const data = await fetchStock(admin);
        if (!active || id !== refreshId) return;
        setUnavailableProductIds(normalizeIds(data.unavailableProductIds));
        setStockQuantities(data.stockQuantities ?? {});
        setDeductedOrderIds(normalizeIds(data.deductedOrderIds));
        setStockError("");
      } catch (error) {
        if (active && id === refreshId) {
          setStockError(error instanceof Error ? error.message : "No se pudo cargar el stock");
        }
      } finally {
        if (active && id === refreshId) setStockLoading(false);
      }
    }

    refreshUnavailableProductIds();
    window.addEventListener(stockChangeEvent, refreshUnavailableProductIds);

    return () => {
      active = false;
      window.removeEventListener(stockChangeEvent, refreshUnavailableProductIds);
    };
  }, [admin]);

  const setProductStockQuantity = useCallback(async (productId: string, quantity: number) => {
    const response = await fetch("/api/admin/stock", {
      method: "PATCH",
      headers: getAdminHeaders(),
      body: JSON.stringify({ productId, quantity }),
    });
    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, "No se pudo guardar la cantidad"));
    }
    const data = (await response.json()) as StockResponse;
    setStockQuantities(data.stockQuantities ?? {});
    setUnavailableProductIds(normalizeIds(data.unavailableProductIds));
    window.dispatchEvent(new Event(stockChangeEvent));
  }, []);

  const deductOrderStock = useCallback(async (orderId: string) => {
    const response = await fetch("/api/admin/orders", {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({ orderId }),
    });
    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, "No se pudo descontar el stock"));
    }
    const data = (await response.json()) as StockResponse;
    setStockQuantities(data.stockQuantities ?? {});
    setUnavailableProductIds(normalizeIds(data.unavailableProductIds));
    setDeductedOrderIds((current) => [...new Set([...current, orderId])]);
    window.dispatchEvent(new Event(stockChangeEvent));
  }, []);

  const unavailableProductIdSet = useMemo(
    () => new Set(unavailableProductIds),
    [unavailableProductIds],
  );

  const setProductsAvailability = useCallback(
    async (productIds: string[], available: boolean) => {
      const response = await fetch("/api/admin/stock", {
        body: JSON.stringify({ available, productIds }),
        headers: getAdminHeaders(),
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, "No se pudo actualizar el stock"),
        );
      }

      const data = (await response.json()) as StockResponse;
      const nextIds = normalizeIds(data.unavailableProductIds);

      setUnavailableProductIds(nextIds);
      setStockQuantities(data.stockQuantities ?? {});
      window.dispatchEvent(new Event(stockChangeEvent));

      return nextIds;
    },
    [],
  );

  const markProductsUnavailable = useCallback(
    (productIds: string[]) => setProductsAvailability(productIds, false),
    [setProductsAvailability],
  );

  const markProductsAvailable = useCallback(
    (productIds: string[]) => setProductsAvailability(productIds, true),
    [setProductsAvailability],
  );

  const setProductAvailability = useCallback(
    (productId: string, available: boolean) =>
      setProductsAvailability([productId], available),
    [setProductsAvailability],
  );

  const createFinishedOrder = useCallback(
    async (order: CreateFinishedOrderInput) => {
      const response = await fetch("/api/admin/orders", {
        body: JSON.stringify(order),
        headers: getAdminHeaders(),
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, "No se pudo terminar el pedido"),
        );
      }

      const data = (await response.json()) as StockResponse;
      const nextIds = normalizeIds(data.unavailableProductIds);

      setUnavailableProductIds(nextIds);
      window.dispatchEvent(new Event(stockChangeEvent));
      window.dispatchEvent(new Event(ordersChangeEvent));

      return nextIds;
    },
    [],
  );

  return {
    createFinishedOrder,
    deductOrderStock,
    deductedOrderIds,
    setProductStockQuantity,
    stockQuantities,
    stockLoading,
    stockError,
    unavailableProductIds,
    unavailableProductIdSet,
    markProductsAvailable,
    markProductsUnavailable,
    setProductAvailability,
  };
}

export function useFinishedOrders() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersError, setOrdersError] = useState("");
  const [deletingOrderId, setDeletingOrderId] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");

  useEffect(() => {
    async function refreshOrders() {
      const response = await fetch("/api/admin/orders", {
        cache: "no-store",
        headers: {
          "x-mava-admin-key": getStoredAdminKey(),
        },
      });

      if (!response.ok) {
        setOrdersError(
          await getApiErrorMessage(response, "No se pudieron cargar pedidos"),
        );
        setOrders([]);
        return;
      }

      const data = (await response.json()) as OrdersResponse;
      setOrdersError("");
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    }

    refreshOrders();
    window.addEventListener(ordersChangeEvent, refreshOrders);

    return () => {
      window.removeEventListener(ordersChangeEvent, refreshOrders);
    };
  }, []);

  const updateOrderStatus = useCallback(
    async (id: string, status: OrderStatus) => {
      setUpdatingOrderId(id);
      setOrdersError("");

      try {
        const response = await fetch("/api/admin/orders", {
          body: JSON.stringify({ id, status }),
          headers: getAdminHeaders(),
          method: "PATCH",
        });

        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(
              response,
              "No se pudo actualizar estado",
            ),
          );
        }

        const data = (await response.json()) as OrderResponse;

        if (data.order) {
          setOrders((current) =>
            current.map((order) => (order.id === id ? data.order! : order)),
          );
        }
      } catch (error) {
        setOrdersError(
          error instanceof Error
            ? error.message
            : "No se pudo actualizar estado",
        );
      } finally {
        setUpdatingOrderId("");
      }
    },
    [],
  );

  const deleteOrder = useCallback(async (id: string) => {
    setDeletingOrderId(id);
    setOrdersError("");

    try {
      const response = await fetch("/api/admin/orders", {
        body: JSON.stringify({ id }),
        headers: getAdminHeaders(),
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, "No se pudo borrar el pedido"),
        );
      }

      setOrders((current) => current.filter((order) => order.id !== id));
      window.dispatchEvent(new Event(ordersChangeEvent));
    } catch (error) {
      setOrdersError(
        error instanceof Error ? error.message : "No se pudo borrar el pedido",
      );
    } finally {
      setDeletingOrderId("");
    }
  }, []);

  return {
    deleteOrder,
    deletingOrderId,
    orders,
    ordersError,
    updateOrderStatus,
    updatingOrderId,
  };
}
