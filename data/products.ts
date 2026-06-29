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

export type ProductFolderId =
  | "extra-grandes"
  | "grandes"
  | "medianos"
  | "chicos";
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
export type PriceOptionId = "blanco" | "arpillera" | "base";
export type SelectedPriceIds = Record<string, PriceOptionId | undefined>;
type SelectionSearchParams = {
  get(name: string): string | null;
};

export type ProductPriceOption = {
  id: PriceOptionId;
  label: string;
  shortLabel: string;
  price: string;
  amountInThousands: number;
};

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
] as const satisfies readonly ProductPriceOption[];

const priceOptionsByMeasureCode: Record<
  ProductMeasureCode,
  readonly ProductPriceOption[]
> = {
  XG: priceOptions,
  XGM: priceOptions,
  DNG: [
    {
      id: "blanco",
      label: "Fondo blanco",
      shortLabel: "Blanco",
      price: "$87k",
      amountInThousands: 87,
    },
    {
      id: "arpillera",
      label: "Fondo arpillera",
      shortLabel: "Arpillera",
      price: "$95k",
      amountInThousands: 95,
    },
  ],
  TC: [
    {
      id: "base",
      label: "Precio",
      shortLabel: "Precio",
      price: "$45k",
      amountInThousands: 45,
    },
  ],
  SG: [
    {
      id: "base",
      label: "Precio",
      shortLabel: "Precio",
      price: "$320k",
      amountInThousands: 320,
    },
  ],
  SGF: [
    {
      id: "base",
      label: "Precio",
      shortLabel: "Precio",
      price: "$249k",
      amountInThousands: 249,
    },
  ],
  TEXTURADO: [
    {
      id: "base",
      label: "Precio",
      shortLabel: "Precio",
      price: "$165k",
      amountInThousands: 165,
    },
  ],
};

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
    id: "extra-grandes",
    label: "Extragrandes",
    description: "SGF / SG",
    measures: [
      {
        code: "SGF",
        label: "SGF",
        size: "185 x 85",
      },
      {
        code: "SG",
        label: "SG",
        size: "124 x 184",
      },
    ],
  },
  {
    id: "grandes",
    label: "Grandes",
    description: "TEXTURADOS / XG / XGM",
    measures: [
      {
        code: "TEXTURADO",
        label: "TEXTURADOS",
        size: "85 x 85",
      },
      {
        code: "XG",
        label: "XG",
        size: "115 x 75",
      },
      {
        code: "XGM",
        label: "XGM",
        size: "103 x 73",
      },
    ],
  },
  {
    id: "medianos",
    label: "Medianos",
    description: "DNG",
    measures: [
      {
        code: "DNG",
        label: "DNG",
        size: "64 x 84",
      },
    ],
  },
  {
    id: "chicos",
    label: "Chicos",
    description: "TC",
    measures: [
      {
        code: "TC",
        label: "TC",
        size: "42 x 52",
      },
    ],
  },
] as const satisfies readonly {
  id: ProductFolderId;
  label: string;
  description: string;
  measures: readonly {
    code: ProductMeasureCode;
    label: string;
    size: string;
  }[];
}[];

export function getProductPriceOptions(product: Pick<Product, "measureCode">) {
  return priceOptionsByMeasureCode[product.measureCode];
}

export function getProductDefaultPriceId(
  product: Pick<Product, "measureCode">,
) {
  return getProductPriceOptions(product)[0]?.id;
}

export function findPriceOption(
  product: Pick<Product, "measureCode">,
  priceId?: PriceOptionId,
) {
  return getProductPriceOptions(product).find((option) => option.id === priceId);
}

export function getProductMeasureDimensions(
  product: Pick<Product, "measureCode">,
) {
  return measureDimensionsByCode[product.measureCode];
}

export function isProductLandscape(
  product: Pick<Product, "image">,
) {
  return product.image.width > product.image.height * 1.1;
}

export function getProductPreviewDimensions(
  product: Pick<Product, "image" | "measureCode">,
) {
  const dimensions = getProductMeasureDimensions(product);
  const isLandscapeMeasure = dimensions.width > dimensions.height;
  const isPortraitImage = product.image.height > product.image.width * 1.1;
  const shouldRotateDimensions =
    (isProductLandscape(product) && !isLandscapeMeasure) ||
    (isPortraitImage && isLandscapeMeasure);

  if (shouldRotateDimensions) {
    return {
      width: dimensions.height,
      height: dimensions.width,
    };
  }

  return dimensions;
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
    const product = products.find((item) => item.id === id);
    const selectedPrice = product
      ? findPriceOption(product, selectedPriceIds[id])
      : undefined;

    return total + (selectedPrice?.amountInThousands ?? 0);
  }, 0);
}

export function parseSelectedPriceIds(value?: string | null): SelectedPriceIds {
  if (!value) {
    return {};
  }

  return value.split(",").reduce<SelectedPriceIds>((current, item) => {
    const [productId, priceId] = item.split(":");
    const validPriceId =
      priceId === "blanco" || priceId === "arpillera" || priceId === "base";

    if (productId && validPriceId) {
      current[productId] = priceId;
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

const compactSelectionParam = "s";

const compactPriceCodeById: Record<PriceOptionId, string> = {
  arpillera: "a",
  base: "p",
  blanco: "b",
};

const priceIdByCompactCode = Object.fromEntries(
  Object.entries(compactPriceCodeById).map(([priceId, code]) => [
    code,
    priceId,
  ]),
) as Record<string, PriceOptionId>;

function parseSelectedIds(value?: string | null) {
  return (
    value
      ?.split(",")
      .map((id) => id.trim())
      .filter(Boolean) ?? []
  );
}

export function serializeSelectionParams(
  selectedIds: string[],
  selectedPriceIds: SelectedPriceIds,
) {
  return selectedIds
    .map((id) => {
      const priceId = selectedPriceIds[id];
      const priceCode = priceId ? compactPriceCodeById[priceId] : "";

      return priceCode ? `${id}.${priceCode}` : id;
    })
    .join("_");
}

export function createSelectionSearchParams(
  selectedIds: string[],
  selectedPriceIds: SelectedPriceIds,
) {
  const params = new URLSearchParams();
  const compactSelection = serializeSelectionParams(
    selectedIds,
    selectedPriceIds,
  );

  if (compactSelection) {
    params.set(compactSelectionParam, compactSelection);
  }

  return params;
}

export function parseSelectionParams(searchParams: SelectionSearchParams) {
  const compactSelection = searchParams.get(compactSelectionParam);

  if (compactSelection) {
    return compactSelection
      .split("_")
      .filter(Boolean)
      .reduce(
        (current, item) => {
          const separatorIndex = item.lastIndexOf(".");
          const productId =
            separatorIndex > -1 ? item.slice(0, separatorIndex) : item;
          const priceCode =
            separatorIndex > -1 ? item.slice(separatorIndex + 1) : "";
          const priceId = priceIdByCompactCode[priceCode];

          if (productId) {
            current.ids.push(productId);

            if (priceId) {
              current.selectedPriceIds[productId] = priceId;
            }
          }

          return current;
        },
        {
          ids: [] as string[],
          selectedPriceIds: {} as SelectedPriceIds,
        },
      );
  }

  const ids = parseSelectedIds(searchParams.get("ids"));

  return {
    ids,
    selectedPriceIds: parseSelectedPriceIds(searchParams.get("prices")),
  };
}

const measureSizeByCode: Record<ProductMeasureCode, string> = {
  XG: "115 x 75",
  SGF: "185 x 85",
  SG: "124 x 184",
  DNG: "64 x 84",
  TC: "42 x 52",
  XGM: "103 x 73",
  TEXTURADO: "85 x 85",
};

const measureDimensionsByCode: Record<
  ProductMeasureCode,
  { width: number; height: number }
> = {
  XG: { width: 115, height: 75 },
  SGF: { width: 185, height: 85 },
  SG: { width: 124, height: 184 },
  DNG: { width: 64, height: 84 },
  TC: { width: 42, height: 52 },
  XGM: { width: 103, height: 73 },
  TEXTURADO: { width: 85, height: 85 },
};

const measureLabelByCode: Record<ProductMeasureCode, string> = {
  XG: "XG",
  SGF: "SGF",
  SG: "SG",
  DNG: "DNG",
  TC: "TC",
  XGM: "XGM",
  TEXTURADO: "TEXTURADOS",
};

const folderIdByMeasureCode = productFolders.reduce(
  (current, folder) => {
    folder.measures.forEach((measure) => {
      current[measure.code] = folder.id;
    });

    return current;
  },
  {} as Record<ProductMeasureCode, ProductFolderId>,
);

const themeLabelById = Object.fromEntries(
  productThemes.map((theme) => [theme.id, theme.label]),
) as Record<ProductThemeId, string>;

function formatProductSize(measureCode: ProductMeasureCode) {
  return `${measureLabelByCode[measureCode]} ${measureSizeByCode[measureCode]}`;
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
