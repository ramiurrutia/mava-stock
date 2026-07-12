import {
  products as staticProducts,
  withProductPairInfo,
  type PriceOptionId,
  type Product,
  type ProductMeasureCode,
  type ProductPriceOption,
  type ProductThemeId,
} from "@/data/products";
import { createSupabaseImage } from "@/data/supabase-storage";

const catalogProductsTable = "catalog_products";
const productThemeIds = new Set<ProductThemeId>([
  "abstracto",
  "animales",
  "botanico",
  "objetos",
  "paisajes",
  "retratos",
  "texturas",
  "vehiculos",
]);
const productMeasureCodes = new Set<ProductMeasureCode>([
  "DNG",
  "SG",
  "SGF",
  "TC",
  "TEXTURADO",
  "XG",
  "XGM",
]);
const priceOptionIds = new Set<PriceOptionId>([
  "arpillera",
  "base",
  "blanco",
]);
const measureFolders: Record<ProductMeasureCode, string> = {
  DNG: "DNG",
  SG: "SG",
  SGF: "SGF",
  TC: "TC",
  TEXTURADO: "TEXTURADOS",
  XG: "XG",
  XGM: "XGM",
};
const measureSizes: Record<ProductMeasureCode, string> = {
  DNG: "DNG 64 x 84",
  SG: "SG 124 x 184",
  SGF: "SGF 185 x 85",
  TC: "TC 42 x 52",
  TEXTURADO: "TEXTURADOS 85 x 85",
  XG: "XG 115 x 75",
  XGM: "XGM 103 x 63",
};
const measureFolderIds: Record<ProductMeasureCode, Product["folderId"]> = {
  DNG: "medianos",
  SG: "extra-grandes",
  SGF: "extra-grandes",
  TC: "chicos",
  TEXTURADO: "grandes",
  XG: "grandes",
  XGM: "grandes",
};
const categoryLabels: Record<ProductThemeId, string> = {
  abstracto: "Abstracto",
  animales: "Animales",
  botanico: "Botanico",
  objetos: "Objetos",
  paisajes: "Paisajes",
  retratos: "Retratos",
  texturas: "Texturas",
  vehiculos: "Vehiculos",
};

type CatalogProductRow = {
  code?: unknown;
  created_at?: unknown;
  height?: unknown;
  measure_code?: unknown;
  price_options?: unknown;
  storage_path?: unknown;
  theme_id?: unknown;
  width?: unknown;
};

export type CreateCatalogProductInput = {
  code: string;
  height: number;
  measureCode: ProductMeasureCode;
  priceOptions: ProductPriceOption[];
  storagePath: string;
  themeId: ProductThemeId;
  width: number;
};

export type DeletedCatalogProduct = {
  code: string;
  storagePath: string;
};

export class CatalogProductsUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogProductsUnavailableError";
  }
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getRemoteCatalogConfig() {
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

async function fetchCatalogProducts(pathname: string, init: RequestInit = {}) {
  const config = getRemoteCatalogConfig();

  if (!config) {
    throw new CatalogProductsUnavailableError(
      "Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
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
    const missingCatalogTable =
      response.status === 404 && pathname.startsWith(catalogProductsTable);

    if (missingCatalogTable) {
      throw new CatalogProductsUnavailableError(
        "Falta crear la tabla public.catalog_products en Supabase. Ejecuta el bloque catalog_products de supabase-schema.sql en el SQL Editor del proyecto correcto.",
      );
    }

    throw new CatalogProductsUnavailableError(
      details || "No se pudo conectar con Supabase para leer productos.",
    );
  }

  return response;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizePriceOptions(value: unknown): ProductPriceOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((option): option is ProductPriceOption => {
    if (!option || typeof option !== "object" || Array.isArray(option)) {
      return false;
    }

    const parsed = option as Partial<ProductPriceOption>;

    return (
      priceOptionIds.has(parsed.id as PriceOptionId) &&
      typeof parsed.label === "string" &&
      typeof parsed.shortLabel === "string" &&
      typeof parsed.price === "string" &&
      typeof parsed.amountInThousands === "number"
    );
  });
}

function normalizeCatalogProduct(row: CatalogProductRow): Product | null {
  const code = readString(row.code);
  const measureCode = readString(row.measure_code) as ProductMeasureCode;
  const themeId = readString(row.theme_id) as ProductThemeId;
  const storagePath = readString(row.storage_path);
  const width = readNumber(row.width);
  const height = readNumber(row.height);
  const priceOptions = normalizePriceOptions(row.price_options);

  if (
    !code ||
    !storagePath ||
    !productMeasureCodes.has(measureCode) ||
    !productThemeIds.has(themeId) ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  return withProductPairInfo({
    available: true,
    category: categoryLabels[themeId],
    code,
    dynamic: true,
    folderId: measureFolderIds[measureCode],
    id: slugify(code),
    image: createSupabaseImage(storagePath, width, height),
    measureCode,
    name: code,
    priceOptions,
    size: measureSizes[measureCode],
    themeId,
  });
}

export function getDynamicStoragePath(
  measureCode: ProductMeasureCode,
  fileName: string,
) {
  return `images/${measureFolders[measureCode]}/${fileName}`;
}

export async function getCatalogProducts() {
  const response = await fetchCatalogProducts(
    `${catalogProductsTable}?select=code,measure_code,storage_path,width,height,price_options,theme_id&order=created_at.asc`,
  );
  const rows = (await response.json()) as CatalogProductRow[];

  return rows
    .map(normalizeCatalogProduct)
    .filter((product): product is Product => Boolean(product));
}

export async function createCatalogProduct(input: CreateCatalogProductInput) {
  const response = await fetchCatalogProducts(
    `${catalogProductsTable}?select=code,measure_code,storage_path,width,height,price_options,theme_id`,
    {
      body: JSON.stringify({
        code: input.code,
        height: input.height,
        measure_code: input.measureCode,
        price_options: input.priceOptions,
        storage_path: input.storagePath,
        theme_id: input.themeId,
        width: input.width,
      }),
      headers: {
        Prefer: "return=representation",
      },
      method: "POST",
    },
  );
  const rows = (await response.json()) as CatalogProductRow[];

  return normalizeCatalogProduct(rows[0] ?? {});
}

export async function getCatalogProductStoragePath(code: string) {
  const response = await fetchCatalogProducts(
    `${catalogProductsTable}?select=code,storage_path&code=ilike.${encodeURIComponent(code)}`,
  );
  const rows = (await response.json()) as CatalogProductRow[];
  const row = rows[0];
  const storagePath = readString(row?.storage_path);

  return storagePath || null;
}

export async function deleteCatalogProduct(
  code: string,
): Promise<DeletedCatalogProduct | null> {
  const response = await fetchCatalogProducts(
    `${catalogProductsTable}?select=code,storage_path&code=ilike.${encodeURIComponent(code)}`,
  );
  const rows = (await response.json()) as CatalogProductRow[];
  const row = rows[0];
  const productCode = readString(row?.code);
  const storagePath = readString(row?.storage_path);

  if (!productCode || !storagePath) {
    return null;
  }

  await fetchCatalogProducts(
    `${catalogProductsTable}?code=eq.${encodeURIComponent(productCode)}`,
    {
      headers: {
        Prefer: "return=minimal",
      },
      method: "DELETE",
    },
  );

  return {
    code: productCode,
    storagePath,
  };
}

export async function getNextCatalogProductCode(
  measureCode: ProductMeasureCode,
) {
  const dynamicProducts = await getCatalogProducts().catch(() => []);
  const prefix = measureCode;
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const highestNumber = [...staticProducts, ...dynamicProducts].reduce(
    (highest, product) => {
      if (product.measureCode !== measureCode) {
        return highest;
      }

      const match = product.code.match(
        new RegExp(`^${escapedPrefix}-(\\d{3})$`, "i"),
      );
      const codeNumber = match ? Number(match[1]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    },
    0,
  );

  return `${prefix}-${String(highestNumber + 1).padStart(3, "0")}`;
}
