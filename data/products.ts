import type { StaticImageData } from "next/image";
import { productAssets, type ProductAsset } from "@/data/product-assets";

export type Product = {
  id: string;
  code: string;
  name: string;
  category: string;
  folderId: ProductFolderId;
  measureCode: ProductMeasureCode;
  size: string;
  themeId: ProductThemeId;
  available: boolean;
  image: StaticImageData;
};

export type ProductFolderId = "clasicos" | "medianos" | "gigantes";
export type ProductMeasureCode =
  | "XG"
  | "SGF"
  | "SG"
  | "DNG"
  | "TC"
  | "XGM"
  | "TEXTURADO";
export type ProductThemeId =
  | "abstracto"
  | "animales"
  | "botanico"
  | "objetos"
  | "paisajes"
  | "retratos"
  | "texturas"
  | "vehiculos";
export type PriceOptionId = "blanco" | "arpillera";
export type SelectedPriceIds = Record<string, PriceOptionId | undefined>;

export const priceOptions = [
  {
    id: "blanco",
    label: "Fondo blanco",
    shortLabel: "Blanco",
    price: "$129k",
    amountInThousands: 129,
  },
  {
    id: "arpillera",
    label: "Fondo arpillera",
    shortLabel: "Arpillera",
    price: "$142k",
    amountInThousands: 142,
  },
] as const;

export const productThemes = [
  {
    id: "abstracto",
    label: "Abstracto",
  },
  {
    id: "botanico",
    label: "Botanico",
  },
  {
    id: "paisajes",
    label: "Paisajes",
  },
  {
    id: "animales",
    label: "Animales",
  },
  {
    id: "retratos",
    label: "Retratos",
  },
  {
    id: "vehiculos",
    label: "Vehiculos",
  },
  {
    id: "objetos",
    label: "Objetos",
  },
  {
    id: "texturas",
    label: "Texturas",
  },
] as const satisfies readonly {
  id: ProductThemeId;
  label: string;
}[];

export const productFolders = [
  {
    id: "clasicos",
    label: "Clasicos",
    description: "Para los formatos mas pedidos.",
    measures: [
      {
        code: "XGM",
        size: "73 x 103",
      },
      {
        code: "XG",
        size: "85 x 115",
      },
    ],
  },
  {
    id: "medianos",
    label: "Medianos",
    description: "Formatos faciles de combinar.",
    measures: [
      {
        code: "DNG",
        size: "64 x 84",
      },
      {
        code: "TC",
        size: "42 x 52",
      },
      {
        code: "TEXTURADO",
        size: "85 x 85",
      },
    ],
  },
  {
    id: "gigantes",
    label: "Gigantes",
    description: "Formatos de alto impacto.",
    measures: [
      {
        code: "SGF",
        size: "185 x 85",
      },
      {
        code: "SG",
        size: "124 x 184",
      },
    ],
  },
] as const;

export function findPriceOption(priceId?: PriceOptionId) {
  return priceOptions.find((option) => option.id === priceId);
}

export function formatPriceTotal(amountInThousands: number) {
  if (amountInThousands < 1000) {
    return `$${amountInThousands}k`;
  }

  return `$${(amountInThousands * 1000).toLocaleString("es-AR")}`;
}

export function getSelectedPriceTotal(
  selectedIds: string[],
  selectedPriceIds: SelectedPriceIds,
) {
  return selectedIds.reduce((total, id) => {
    const selectedPrice = findPriceOption(selectedPriceIds[id]);

    return total + (selectedPrice?.amountInThousands ?? 0);
  }, 0);
}

export function parseSelectedPriceIds(value?: string | null): SelectedPriceIds {
  if (!value) {
    return {};
  }

  return value.split(",").reduce<SelectedPriceIds>((current, item) => {
    const [productId, priceId] = item.split(":");
    const validPriceId = priceOptions.find((option) => option.id === priceId);

    if (productId && validPriceId) {
      current[productId] = validPriceId.id;
    }

    return current;
  }, {});
}

export function serializeSelectedPriceIds(
  selectedIds: string[],
  selectedPriceIds: SelectedPriceIds,
) {
  return selectedIds
    .map((id) => {
      const priceId = selectedPriceIds[id];

      return priceId ? `${id}:${priceId}` : null;
    })
    .filter(Boolean)
    .join(",");
}

const measureSizeByCode: Record<ProductMeasureCode, string> = {
  XG: "85 x 115",
  SGF: "185 x 85",
  SG: "124 x 184",
  DNG: "64 x 84",
  TC: "42 x 52",
  XGM: "73 x 103",
  TEXTURADO: "85 x 85",
};

const folderIdByMeasureCode: Record<ProductMeasureCode, ProductFolderId> = {
  XG: "clasicos",
  SGF: "gigantes",
  SG: "gigantes",
  DNG: "medianos",
  TC: "medianos",
  XGM: "clasicos",
  TEXTURADO: "medianos",
};

const themeLabelById = Object.fromEntries(
  productThemes.map((theme) => [theme.id, theme.label]),
) as Record<ProductThemeId, string>;

function formatProductSize(measureCode: ProductMeasureCode) {
  return `${measureCode} ${measureSizeByCode[measureCode]}`;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createProduct(asset: ProductAsset): Product {
  return {
    id: slugify(asset.code),
    code: asset.code,
    name: asset.name,
    category: themeLabelById[asset.themeId],
    folderId: folderIdByMeasureCode[asset.measureCode],
    measureCode: asset.measureCode,
    size: formatProductSize(asset.measureCode),
    themeId: asset.themeId,
    available: true,
    image: asset.image,
  };
}

export const products: Product[] = productAssets.map(createProduct);

export const categories = productThemes.map((theme) => theme.label);
