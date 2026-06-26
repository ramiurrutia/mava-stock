import type { StaticImageData } from "next/image";
import dng001 from "@/app/sources/images/dng/DNG-001.png";
import dng002 from "@/app/sources/images/dng/DNG-002.png";
import dng003 from "@/app/sources/images/dng/DNG-003.png";
import dng004 from "@/app/sources/images/dng/DNG-004.png";
import dng005 from "@/app/sources/images/dng/DNG-005.png";
import dng006 from "@/app/sources/images/dng/DNG-006.png";
import dng007 from "@/app/sources/images/dng/DNG-007.png";
import dng008 from "@/app/sources/images/dng/DNG-008.png";
import dng009 from "@/app/sources/images/dng/DNG-009.png";
import dng010 from "@/app/sources/images/dng/DNG-010.png";
import dng011 from "@/app/sources/images/dng/DNG-011.png";
import dng012 from "@/app/sources/images/dng/DNG-012.png";
import dng013 from "@/app/sources/images/dng/DNG-013.png";
import dng014 from "@/app/sources/images/dng/DNG-014.png";
import dng015 from "@/app/sources/images/dng/DNG-015.png";
import dng019 from "@/app/sources/images/dng/DNG-019.png";
import dng020 from "@/app/sources/images/dng/DNG-020.png";
import dng021 from "@/app/sources/images/dng/DNG-021.png";
import dng022 from "@/app/sources/images/dng/DNG-022.png";
import dng023 from "@/app/sources/images/dng/DNG-023.png";
import dng024 from "@/app/sources/images/dng/DNG-024.png";
import dng025 from "@/app/sources/images/dng/DNG-025.png";
import dng026 from "@/app/sources/images/dng/DNG-026.png";
import xg001 from "@/app/sources/images/xg/XG-001.png";
import xg002 from "@/app/sources/images/xg/XG-002.png";
import xg003 from "@/app/sources/images/xg/XG-003.png";
import xg004 from "@/app/sources/images/xg/XG-004.png";
import xg005 from "@/app/sources/images/xg/XG-005.png";
import xg006 from "@/app/sources/images/xg/XG-006.png";
import xg007 from "@/app/sources/images/xg/XG-007.png";
import xg008 from "@/app/sources/images/xg/XG-008.png";
import xg009 from "@/app/sources/images/xg/XG-009.png";

export type Product = {
  id: string;
  code: string;
  name: string;
  category: string;
  folderId: ProductFolderId;
  measureCode: ProductMeasureCode;
  finish: ProductFinish;
  size: string;
  available: boolean;
  image: StaticImageData;
};

export type ProductFolderId = "clasicos" | "medianos" | "gigantes";
export type ProductMeasureCode = "XGM" | "XG" | "DNG" | "TC" | "SGF" | "SG";
export type ProductFinish = "liso" | "cuadrado" | "texturado";
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

export const productFolders = [
  {
    id: "clasicos",
    label: "Clasicos",
    description: "Para los formatos mas pedidos.",
    measures: [
      {
        code: "XGM",
        size: "107 x 73",
      },
      {
        code: "XG",
        size: "115 x 65",
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
        size: "65 x 85",
      },
      {
        code: "TC",
        size: "43 x 53",
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
        size: "120 x 180",
      },
    ],
  },
] as const;

export function findPriceOption(priceId?: PriceOptionId) {
  return priceOptions.find((option) => option.id === priceId);
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

export const finishOptions = [
  {
    id: "liso",
    label: "Lisos",
  },
  {
    id: "cuadrado",
    label: "Cuadrados",
  },
  {
    id: "texturado",
    label: "Texturados",
  },
] as const;

const measureSizeByCode: Record<ProductMeasureCode, string> = {
  XGM: "107 x 73",
  XG: "115 x 65",
  DNG: "65 x 85",
  TC: "43 x 53",
  SGF: "185 x 85",
  SG: "120 x 180",
};

const finishLabelById: Record<ProductFinish, string> = {
  liso: "Liso",
  cuadrado: "Cuadrado",
  texturado: "Texturado",
};

function formatProductSize(
  measureCode: ProductMeasureCode,
  finish: ProductFinish,
) {
  const baseSize = `${measureCode} ${measureSizeByCode[measureCode]}`;

  if (finish === "liso") {
    return baseSize;
  }

  return `${baseSize} / ${finishLabelById[finish]}`;
}

const dngImages = [
  ["DNG-001", dng001],
  ["DNG-002", dng002],
  ["DNG-003", dng003],
  ["DNG-004", dng004],
  ["DNG-005", dng005],
  ["DNG-006", dng006],
  ["DNG-007", dng007],
  ["DNG-008", dng008],
  ["DNG-009", dng009],
  ["DNG-010", dng010],
  ["DNG-011", dng011],
  ["DNG-012", dng012],
  ["DNG-013", dng013],
  ["DNG-014", dng014],
  ["DNG-015", dng015],
  ["DNG-019", dng019],
  ["DNG-020", dng020],
  ["DNG-021", dng021],
  ["DNG-022", dng022],
  ["DNG-023", dng023],
  ["DNG-024", dng024],
  ["DNG-025", dng025],
  ["DNG-026", dng026],
] as const satisfies readonly (readonly [string, StaticImageData])[];

const xgImages = [
  ["XG-001", xg001],
  ["XG-002", xg002],
  ["XG-003", xg003],
  ["XG-004", xg004],
  ["XG-005", xg005],
  ["XG-006", xg006],
  ["XG-007", xg007],
  ["XG-008", xg008],
  ["XG-009", xg009],
] as const satisfies readonly (readonly [string, StaticImageData])[];

const folderIdByMeasureCode: Record<ProductMeasureCode, ProductFolderId> = {
  XGM: "clasicos",
  XG: "clasicos",
  DNG: "medianos",
  TC: "medianos",
  SGF: "gigantes",
  SG: "gigantes",
};

function inferProductFinish(image: StaticImageData): ProductFinish {
  const ratio = image.width / image.height;

  if (ratio >= 0.9 && ratio <= 1.1) {
    return "cuadrado";
  }

  return "liso";
}

function createProduct(
  code: string,
  image: StaticImageData,
  measureCode: ProductMeasureCode,
): Product {
  const finish = inferProductFinish(image);

  return {
    id: code.toLowerCase(),
    code,
    name: code,
    category: measureCode,
    folderId: folderIdByMeasureCode[measureCode],
    measureCode,
    finish,
    size: formatProductSize(measureCode, finish),
    available: true,
    image,
  };
}

export const products: Product[] = [
  ...dngImages.map(([code, image]) => createProduct(code, image, "DNG")),
  ...xgImages.map(([code, image]) => createProduct(code, image, "XG")),
];

export const categories = Array.from(
  new Set(products.map((product) => product.category)),
).sort();
