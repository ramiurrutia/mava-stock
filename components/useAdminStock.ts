"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CustomerOrder, OrderStatus } from "@/data/orders";
import type { Product } from "@/data/products";

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

async function fetchStock() {
  const response = await fetch("/api/stock", { cache: "no-store" });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as StockResponse;

  return normalizeIds(data.unavailableProductIds);
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

async function getApiErrorMessage(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as
    | { error?: unknown }
    | null;

  return typeof data?.error === "string" ? data.error : fallback;
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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function refreshAdminMode() {
      const response = await fetch("/api/admin/session", {
        cache: "no-store",
        headers: {
          "x-mava-admin-key": getStoredAdminKey(),
        },
      });

      if (!response.ok) {
        setIsAdmin(false);
        return;
      }

      const data = (await response.json()) as SessionResponse;
      setIsAdmin(Boolean(data.authenticated));
    }

    refreshAdminMode();
    window.addEventListener(adminModeChangeEvent, refreshAdminMode);

    return () => {
      window.removeEventListener(adminModeChangeEvent, refreshAdminMode);
    };
  }, []);

  const loginAdmin = useCallback(async (password: string) => {
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
  }, []);

  const logoutAdmin = useCallback(async () => {
    window.localStorage.removeItem(adminKeyStorageKey);
    setIsAdmin(false);
    window.dispatchEvent(new Event(adminModeChangeEvent));
  }, []);

  return { isAdmin, loginAdmin, logoutAdmin };
}

export function useLocalStock() {
  const [unavailableProductIds, setUnavailableProductIds] = useState<string[]>(
    [],
  );

  useEffect(() => {
    async function refreshUnavailableProductIds() {
      setUnavailableProductIds(await fetchStock());
    }

    refreshUnavailableProductIds();
    window.addEventListener(stockChangeEvent, refreshUnavailableProductIds);

    return () => {
      window.removeEventListener(stockChangeEvent, refreshUnavailableProductIds);
    };
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
