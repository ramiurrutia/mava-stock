import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type FinishedOrderLog = {
  id: string;
  createdAt: string;
  productIds: string[];
  productCodes: string[];
  selectedPriceIds: Record<string, string | undefined>;
  totalInThousands: number;
  sharePath: string;
};

type AdminStore = {
  remoteUpdatedAt?: string | null;
  stockQuantities: Record<string, number>;
  unavailableProductIds: string[];
  orders: FinishedOrderLog[];
};

const storePath = path.join(process.cwd(), "data", "admin-store.json");
const supabaseStoreTable = "mava_admin_store";
const supabaseStoreId = "main";

const defaultStore: AdminStore = {
  stockQuantities: {},
  unavailableProductIds: [],
  orders: [],
};

export class AdminStoreUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminStoreUnavailableError";
  }
}

export function isAdminStoreUnavailableError(
  error: unknown,
): error is AdminStoreUnavailableError {
  return error instanceof AdminStoreUnavailableError;
}

function getRemoteStoreConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    serviceRoleKey,
    url: url.replace(/\/$/, ""),
  };
}

function normalizeStore(value: unknown): AdminStore {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...defaultStore };
  }

  const parsed = value as Partial<AdminStore>;

  return {
    stockQuantities:
      parsed.stockQuantities && typeof parsed.stockQuantities === "object"
        ? Object.fromEntries(
            Object.entries(parsed.stockQuantities).filter(
              ([, quantity]) => Number.isSafeInteger(quantity) && quantity >= 0,
            ),
          )
        : {},
    unavailableProductIds: Array.isArray(parsed.unavailableProductIds)
      ? parsed.unavailableProductIds.filter(
          (id): id is string => typeof id === "string",
        )
      : [],
    orders: Array.isArray(parsed.orders) ? parsed.orders : [],
  };
}

type SupabaseStoreRow = {
  updated_at?: string;
  stock_quantities?: unknown;
  unavailable_product_ids?: unknown;
  orders?: unknown;
};

function normalizeSupabaseStore(row: SupabaseStoreRow | null): AdminStore {
  if (!row) {
    return { ...defaultStore };
  }

  return normalizeStore({
    stockQuantities: row.stock_quantities,
    orders: row.orders,
    unavailableProductIds: row.unavailable_product_ids,
  });
}

function getSupabaseHeaders(
  serviceRoleKey: string,
  extraHeaders: Record<string, string> = {},
) {
  const authHeaders: Record<string, string> = serviceRoleKey.startsWith(
    "sb_secret_",
  )
    ? {}
    : { Authorization: `Bearer ${serviceRoleKey}` };

  return {
    apikey: serviceRoleKey,
    "Content-Type": "application/json",
    ...authHeaders,
    ...extraHeaders,
  };
}

async function fetchSupabase(pathname: string, init: RequestInit = {}) {
  const config = getRemoteStoreConfig();

  if (!config) {
    throw new AdminStoreUnavailableError(
      "Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel.",
    );
  }

  const response = await fetch(`${config.url}/rest/v1/${pathname}`, {
    cache: "no-store",
    ...init,
    headers: getSupabaseHeaders(config.serviceRoleKey, {
      ...Object.fromEntries(new Headers(init.headers).entries()),
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");

    throw new AdminStoreUnavailableError(
      details || "No se pudo conectar con Supabase para guardar stock.",
    );
  }

  return response;
}

async function readRemoteStore(): Promise<AdminStore> {
  const response = await fetchSupabase(
    `${supabaseStoreTable}?id=eq.${supabaseStoreId}&select=*&limit=1`,
  );
  const rows = (await response.json()) as SupabaseStoreRow[];

  return {
    ...normalizeSupabaseStore(rows[0] ?? null),
    remoteUpdatedAt: rows[0]?.updated_at ?? null,
  };
}

async function writeRemoteStore(store: AdminStore) {
  const version = store.remoteUpdatedAt;
  const pathname = version
    ? `${supabaseStoreTable}?id=eq.${supabaseStoreId}&updated_at=eq.${encodeURIComponent(version)}`
    : supabaseStoreTable;
  const updatedAt = new Date(Math.max(Date.now(), version ? Date.parse(version) + 1 : 0)).toISOString();
  const response = await fetchSupabase(pathname, {
    body: JSON.stringify({
      id: supabaseStoreId,
      stock_quantities: store.stockQuantities,
      orders: store.orders,
      unavailable_product_ids: store.unavailableProductIds,
      updated_at: updatedAt,
    }),
    headers: {
      Prefer: "resolution=ignore-duplicates,return=representation",
    },
    method: version ? "PATCH" : "POST",
  });
  const rows = (await response.json()) as SupabaseStoreRow[];
  return rows.length > 0;
}

async function readStore(): Promise<AdminStore> {
  if (getRemoteStoreConfig()) {
    return readRemoteStore();
  }

  try {
    const value = await readFile(storePath, "utf8");
    return normalizeStore(JSON.parse(value));
  } catch {
    return { ...defaultStore };
  }
}

async function writeStore(store: AdminStore) {
  if (getRemoteStoreConfig()) {
    return writeRemoteStore(store);
  }

  if (process.env.VERCEL) {
    throw new AdminStoreUnavailableError(
      "Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel para guardar stock.",
    );
  }

  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  return true;
}

let stockWriteQueue: Promise<unknown> = Promise.resolve();

function updateStore(change: (store: AdminStore) => void): Promise<AdminStore> {
  const operation = stockWriteQueue.then(async () => {
    // Retry against the latest row if another admin saved at the same time.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const store = await readStore();
      change(store);
      if (await writeStore(store)) return store;
    }
    throw new AdminStoreUnavailableError("El stock cambio mientras guardabas. Volve a intentar.");
  });
  stockWriteQueue = operation.catch(() => undefined);
  return operation;
}

export async function getUnavailableProductIds() {
  const store = await readStore();

  return store.unavailableProductIds;
}

export async function getStockState() {
  const store = await readStore();
  return {
    stockQuantities: store.stockQuantities,
    unavailableProductIds: store.unavailableProductIds,
    deductedOrderIds: store.orders.map((order) => order.id),
  };
}

function getStockQuantity(store: AdminStore, productId: string) {
  return store.stockQuantities[productId] ??
    (store.unavailableProductIds.includes(productId) ? 0 : 1);
}

function updateStockQuantity(store: AdminStore, productId: string, quantity: number) {
  store.stockQuantities = { ...store.stockQuantities, [productId]: quantity };
  const unavailableSet = new Set(store.unavailableProductIds);
  if (quantity === 0) {
    unavailableSet.add(productId);
  } else {
    unavailableSet.delete(productId);
  }
  store.unavailableProductIds = Array.from(unavailableSet).sort();
}

export async function setProductStockQuantity(productId: string, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 9999) {
    throw new Error("La cantidad debe ser un entero entre 0 y 9999.");
  }
  await updateStore((store) => updateStockQuantity(store, productId, quantity));
}

export async function setProductsAvailability(
  productIds: string[],
  available: boolean,
) {
  const store = await updateStore((store) => {
    for (const productId of new Set(productIds)) {
      updateStockQuantity(store, productId, available ? Math.max(1, getStockQuantity(store, productId)) : 0);
    }
  });
  return store.unavailableProductIds;
}

export async function getFinishedOrders() {
  const store = await readStore();

  return store.orders;
}

export async function createFinishedOrder(
  order: Omit<FinishedOrderLog, "id" | "createdAt">,
  orderId?: string,
) {
  const nextOrder: FinishedOrderLog = {
    ...order,
    id: orderId ?? crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  return updateStore((store) => {
    if (orderId && store.orders.some((entry) => entry.id === orderId)) return;
    for (const productId of new Set(order.productIds)) {
      updateStockQuantity(store, productId, Math.max(0, getStockQuantity(store, productId) - 1));
    }
    store.orders = [nextOrder, ...store.orders];
  });
}

