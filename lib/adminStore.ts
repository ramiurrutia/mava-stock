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
const remoteStoreKey = "mava-admin-store";

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
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return { token, url };
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

async function redisCommand<T>(command: unknown[]): Promise<T> {
  const config = getRemoteStoreConfig();

  if (!config) {
    throw new AdminStoreUnavailableError(
      "Falta configurar almacenamiento para guardar stock en Vercel.",
    );
  }

  const response = await fetch(config.url, {
    body: JSON.stringify(command),
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new AdminStoreUnavailableError(
      "No se pudo conectar con el almacenamiento de stock.",
    );
  }

  const data = (await response.json()) as { error?: string; result?: T };

  if (data.error) {
    throw new AdminStoreUnavailableError(data.error);
  }

  return data.result as T;
}

async function readRemoteStore(): Promise<AdminStore> {
  const value = await redisCommand<string | null>(["GET", remoteStoreKey]);

  if (!value) {
    return defaultStore;
  }

  try {
    return normalizeStore(JSON.parse(value));
  } catch {
    return defaultStore;
  }
}

async function writeRemoteStore(store: AdminStore) {
  await redisCommand<"OK">(["SET", remoteStoreKey, JSON.stringify(store)]);
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
      "Falta configurar KV_REST_API_URL y KV_REST_API_TOKEN en Vercel para guardar stock.",
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

