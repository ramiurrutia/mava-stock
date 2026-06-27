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
  unavailableProductIds: string[];
  orders: FinishedOrderLog[];
};

const storePath = path.join(process.cwd(), "data", "admin-store.json");
const supabaseStoreTable = "mava_admin_store";
const supabaseStoreId = "main";

const defaultStore: AdminStore = {
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
    return defaultStore;
  }

  const parsed = value as Partial<AdminStore>;

  return {
    unavailableProductIds: Array.isArray(parsed.unavailableProductIds)
      ? parsed.unavailableProductIds.filter(
          (id): id is string => typeof id === "string",
        )
      : [],
    orders: Array.isArray(parsed.orders) ? parsed.orders : [],
  };
}

type SupabaseStoreRow = {
  unavailable_product_ids?: unknown;
  orders?: unknown;
};

function normalizeSupabaseStore(row: SupabaseStoreRow | null): AdminStore {
  if (!row) {
    return defaultStore;
  }

  return normalizeStore({
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
    `${supabaseStoreTable}?id=eq.${supabaseStoreId}&select=unavailable_product_ids,orders&limit=1`,
  );
  const rows = (await response.json()) as SupabaseStoreRow[];

  return normalizeSupabaseStore(rows[0] ?? null);
}

async function writeRemoteStore(store: AdminStore) {
  await fetchSupabase(supabaseStoreTable, {
    body: JSON.stringify({
      id: supabaseStoreId,
      orders: store.orders,
      unavailable_product_ids: store.unavailableProductIds,
      updated_at: new Date().toISOString(),
    }),
    headers: {
      Prefer: "resolution=merge-duplicates",
    },
    method: "POST",
  });
}

async function readStore(): Promise<AdminStore> {
  if (getRemoteStoreConfig()) {
    return readRemoteStore();
  }

  try {
    const value = await readFile(storePath, "utf8");
    return normalizeStore(JSON.parse(value));
  } catch {
    return defaultStore;
  }
}

async function writeStore(store: AdminStore) {
  if (getRemoteStoreConfig()) {
    await writeRemoteStore(store);
    return;
  }

  if (process.env.VERCEL) {
    throw new AdminStoreUnavailableError(
      "Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel para guardar stock.",
    );
  }

  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export async function getUnavailableProductIds() {
  const store = await readStore();

  return store.unavailableProductIds;
}

export async function setProductsAvailability(
  productIds: string[],
  available: boolean,
) {
  const store = await readStore();
  const productIdSet = new Set(productIds);
  const unavailableSet = new Set(store.unavailableProductIds);

  for (const productId of productIdSet) {
    if (available) {
      unavailableSet.delete(productId);
    } else {
      unavailableSet.add(productId);
    }
  }

  const nextUnavailableProductIds = Array.from(unavailableSet).sort();
  const nextStore = {
    ...store,
    unavailableProductIds: nextUnavailableProductIds,
  };

  await writeStore(nextStore);

  return nextUnavailableProductIds;
}

export async function getFinishedOrders() {
  const store = await readStore();

  return store.orders;
}

export async function createFinishedOrder(
  order: Omit<FinishedOrderLog, "id" | "createdAt">,
) {
  const store = await readStore();
  const nextOrder: FinishedOrderLog = {
    ...order,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const unavailableProductIds = Array.from(
    new Set([...store.unavailableProductIds, ...order.productIds]),
  ).sort();
  const nextStore = {
    unavailableProductIds,
    orders: [nextOrder, ...store.orders],
  };

  await writeStore(nextStore);

  return nextStore;
}

