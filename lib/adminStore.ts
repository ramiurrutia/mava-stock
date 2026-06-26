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

const defaultStore: AdminStore = {
  unavailableProductIds: [],
  orders: [],
};

async function readStore(): Promise<AdminStore> {
  try {
    const value = await readFile(storePath, "utf8");
    const parsed = JSON.parse(value) as Partial<AdminStore>;

    return {
      unavailableProductIds: Array.isArray(parsed.unavailableProductIds)
        ? parsed.unavailableProductIds.filter(
            (id): id is string => typeof id === "string",
          )
        : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    };
  } catch {
    return defaultStore;
  }
}

async function writeStore(store: AdminStore) {
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

