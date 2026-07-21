import type {
  ProductFolderId,
  ProductMeasureCode,
} from "@/data/products";

const catalogHighlightsTable = "catalog_highlights";

export type CatalogHighlightTargetType = "folder" | "measure" | "product";

export type CatalogHighlights = {
  folderIds: ProductFolderId[];
  measureCodes: ProductMeasureCode[];
  productCodes: string[];
};

type CatalogHighlightRow = {
  target_id?: unknown;
  target_type?: unknown;
};

export const emptyCatalogHighlights: CatalogHighlights = {
  folderIds: [],
  measureCodes: [],
  productCodes: [],
};

function getSupabaseConfig() {
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

function getSupabaseHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    "Content-Type": "application/json",
    ...(serviceRoleKey.startsWith("sb_secret_")
      ? {}
      : { Authorization: `Bearer ${serviceRoleKey}` }),
  };
}

async function fetchHighlights(pathname: string, init: RequestInit = {}) {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(
      "Falta configurar Supabase para guardar los destacados del catalogo.",
    );
  }

  const response = await fetch(`${config.url}/rest/v1/${pathname}`, {
    cache: "no-store",
    ...init,
    headers: {
      ...getSupabaseHeaders(config.serviceRoleKey),
      ...Object.fromEntries(new Headers(init.headers).entries()),
    },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    const missingTable = response.status === 404;

    throw new Error(
      missingTable
        ? "Falta crear public.catalog_highlights en Supabase. Ejecuta el bloque correspondiente de supabase-schema.sql."
        : details || "No se pudieron actualizar los destacados del catalogo.",
    );
  }

  return response;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeHighlights(rows: CatalogHighlightRow[]): CatalogHighlights {
  const folderIds: ProductFolderId[] = [];
  const measureCodes: ProductMeasureCode[] = [];
  const productCodes: string[] = [];

  rows.forEach((row) => {
    const targetType = readString(row.target_type);
    const targetId = readString(row.target_id);

    if (!targetId) {
      return;
    }

    if (targetType === "folder") {
      folderIds.push(targetId as ProductFolderId);
    }

    if (targetType === "measure") {
      measureCodes.push(targetId.toUpperCase() as ProductMeasureCode);
    }

    if (targetType === "product") {
      productCodes.push(targetId.toUpperCase());
    }
  });

  return {
    folderIds: Array.from(new Set(folderIds)),
    measureCodes: Array.from(new Set(measureCodes)),
    productCodes: Array.from(new Set(productCodes)),
  };
}

export async function getCatalogHighlights() {
  const response = await fetchHighlights(
    `${catalogHighlightsTable}?select=target_type,target_id`,
  );
  const rows = (await response.json()) as CatalogHighlightRow[];

  return normalizeHighlights(rows);
}

export async function setCatalogHighlight(input: {
  highlighted: boolean;
  targetId: string;
  targetType: CatalogHighlightTargetType;
}) {
  const targetId =
    input.targetType === "product" || input.targetType === "measure"
      ? input.targetId.trim().toUpperCase()
      : input.targetId.trim();
  const query = `${catalogHighlightsTable}?target_type=eq.${encodeURIComponent(
    input.targetType,
  )}&target_id=eq.${encodeURIComponent(targetId)}`;

  if (input.highlighted) {
    await fetchHighlights(
      `${catalogHighlightsTable}?on_conflict=target_type,target_id`,
      {
        body: JSON.stringify({
          target_id: targetId,
          target_type: input.targetType,
          updated_at: new Date().toISOString(),
        }),
        headers: {
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        method: "POST",
      },
    );
  } else {
    await fetchHighlights(query, {
      headers: {
        Prefer: "return=minimal",
      },
      method: "DELETE",
    });
  }

  return getCatalogHighlights();
}
