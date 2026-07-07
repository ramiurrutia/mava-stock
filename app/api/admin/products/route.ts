import { execFile } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { isAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);
const projectRoot = process.cwd();
const imagesRoot = path.join(projectRoot, "app", "sources", "images");
const metadataPath = path.join(projectRoot, "data", "product-metadata.json");
const storageBucket =
  process.env.SUPABASE_SOURCES_BUCKET ??
  process.env.NEXT_PUBLIC_SUPABASE_SOURCES_BUCKET ??
  "sources";
const storageCacheControl =
  process.env.SUPABASE_STORAGE_CACHE_CONTROL ??
  "public, max-age=31536000, immutable";
const validThemeIds = new Set([
  "abstracto",
  "animales",
  "botanico",
  "objetos",
  "paisajes",
  "retratos",
  "texturas",
  "vehiculos",
]);
const measureConfigs = {
  DNG: { folder: "DNG", prefix: "DNG" },
  SG: { folder: "SG", prefix: "SG" },
  SGF: { folder: "SGF", prefix: "SGF" },
  TC: { folder: "TC", prefix: "TC" },
  TEXTURADO: { folder: "TEXTURADOS", prefix: "TEXTURADO" },
  XG: { folder: "XG", prefix: "XG" },
  XGM: { folder: "XGM", prefix: "XGM" },
} as const;
const validImageExtensions = new Set([".jpeg", ".jpg", ".png"]);
const validPriceModes = new Set(["base", "blanco", "arpillera", "ambos"]);

type MeasureCode = keyof typeof measureConfigs;
type MetadataProduct = {
  code: string;
  fileName: string;
  measureCode: MeasureCode;
  name: string;
  originalFileName: string;
  originalPath: string;
  priceOptions?: ProductPriceOption[];
  themeId: string;
};
type ProductMetadata = {
  products?: MetadataProduct[];
};
type ProductPriceOption = {
  id: "blanco" | "arpillera" | "base";
  label: string;
  shortLabel: string;
  price: string;
  amountInThousands: number;
};

function getSupabaseStorageConfig() {
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

function encodeStoragePath(storagePath: string) {
  return storagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function uploadImageToSupabaseStorage(
  storagePath: string,
  imageBuffer: Buffer,
  contentType: string,
) {
  const config = getSupabaseStorageConfig();

  if (!config) {
    throw new Error(
      "Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para subir la imagen al storage.",
    );
  }

  const response = await fetch(
    `${config.url}/storage/v1/object/${storageBucket}/${encodeStoragePath(storagePath)}`,
    {
      method: "POST",
      headers: {
        apikey: config.serviceRoleKey,
        ...(config.serviceRoleKey.startsWith("sb_secret_")
          ? {}
          : { Authorization: `Bearer ${config.serviceRoleKey}` }),
        "Content-Type": contentType,
        "Cache-Control": storageCacheControl,
        "x-upsert": "true",
      },
      body: new Uint8Array(imageBuffer),
    },
  );

  if (!response.ok) {
    const details = await response.text().catch(() => "");

    throw new Error(
      details || "No se pudo subir la imagen al storage de Supabase.",
    );
  }
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function readMeasureCode(value: string): MeasureCode | null {
  return value in measureConfigs ? (value as MeasureCode) : null;
}

function parsePriceInThousands(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".").trim();
  const number = Number(normalized);

  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

  return Math.round(number);
}

function formatPrice(amountInThousands: number) {
  return `$${amountInThousands.toLocaleString("es-AR")} mil`;
}

function createPriceOption(
  id: ProductPriceOption["id"],
  amountInThousands: number,
): ProductPriceOption {
  if (id === "base") {
    return {
      id,
      label: "Precio",
      shortLabel: "Precio",
      price: formatPrice(amountInThousands),
      amountInThousands,
    };
  }

  return {
    id,
    label: id === "arpillera" ? "Fondo arpillera" : "Fondo blanco",
    shortLabel: id === "arpillera" ? "Arpillera" : "Blanco",
    price: formatPrice(amountInThousands),
    amountInThousands,
  };
}

function readPriceOptions(formData: FormData) {
  const priceMode = readString(formData, "priceMode");

  if (!validPriceModes.has(priceMode)) {
    return null;
  }

  if (priceMode === "base") {
    const price = parsePriceInThousands(readString(formData, "basePrice"));

    return price ? [createPriceOption("base", price)] : null;
  }

  if (priceMode === "blanco") {
    const price = parsePriceInThousands(readString(formData, "blancoPrice"));

    return price ? [createPriceOption("blanco", price)] : null;
  }

  if (priceMode === "arpillera") {
    const price = parsePriceInThousands(
      readString(formData, "arpilleraPrice"),
    );

    return price ? [createPriceOption("arpillera", price)] : null;
  }

  const blancoPrice = parsePriceInThousands(
    readString(formData, "blancoPrice"),
  );
  const arpilleraPrice = parsePriceInThousands(
    readString(formData, "arpilleraPrice"),
  );

  return blancoPrice && arpilleraPrice
    ? [
        createPriceOption("blanco", blancoPrice),
        createPriceOption("arpillera", arpilleraPrice),
      ]
    : null;
}

function getImageExtension(file: File) {
  const extension = path.extname(file.name).toLowerCase();

  if (validImageExtensions.has(extension)) {
    return extension === ".jpeg" ? ".jpg" : extension;
  }

  if (file.type === "image/jpeg") {
    return ".jpg";
  }

  if (file.type === "image/png") {
    return ".png";
  }

  return "";
}

function getCodeNumber(fileName: string, prefix: string) {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = path
    .basename(fileName, path.extname(fileName))
    .match(new RegExp(`^${escapedPrefix}-(\\d{3})$`, "i"));

  return match ? Number(match[1]) : null;
}

async function getNextProductCode(config: (typeof measureConfigs)[MeasureCode]) {
  const folderPath = path.join(imagesRoot, config.folder);
  await mkdir(folderPath, { recursive: true });

  const files = await readdir(folderPath, { withFileTypes: true });
  const highestNumber = files.reduce((highest, entry) => {
    if (!entry.isFile()) {
      return highest;
    }

    const codeNumber = getCodeNumber(entry.name, config.prefix);

    return codeNumber && codeNumber > highest ? codeNumber : highest;
  }, 0);

  return `${config.prefix}-${String(highestNumber + 1).padStart(3, "0")}`;
}

async function readMetadata(): Promise<ProductMetadata> {
  const content = await readFile(metadataPath, "utf8").catch(() => "");

  if (!content) {
    return { products: [] };
  }

  const metadata = JSON.parse(content) as ProductMetadata;

  return {
    products: Array.isArray(metadata.products) ? metadata.products : [],
  };
}

async function regenerateProductAssets() {
  await execFileAsync(process.execPath, ["scripts/generate-product-assets.mjs"], {
    cwd: projectRoot,
  });
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return Response.json({ error: "Formulario invalido" }, { status: 400 });
  }

  const image = formData.get("image");
  const measureCode = readMeasureCode(readString(formData, "measureCode"));
  const name = readString(formData, "name") || "Lamina nueva";
  const themeId = readString(formData, "themeId") || "abstracto";
  const priceOptions = readPriceOptions(formData);

  if (!(image instanceof File) || image.size === 0) {
    return Response.json({ error: "Subi una imagen" }, { status: 400 });
  }

  if (!measureCode) {
    return Response.json({ error: "Elegi una medida valida" }, { status: 400 });
  }

  if (!validThemeIds.has(themeId)) {
    return Response.json(
      { error: "Elegi una categoria valida" },
      { status: 400 },
    );
  }

  if (!priceOptions) {
    return Response.json(
      { error: "Completa el precio de la lamina" },
      { status: 400 },
    );
  }

  const extension = getImageExtension(image);

  if (!extension) {
    return Response.json(
      { error: "La imagen tiene que ser JPG, JPEG o PNG" },
      { status: 400 },
    );
  }

  const config = measureConfigs[measureCode];
  const code = await getNextProductCode(config);
  const fileName = `${code}${extension}`;
  const folderPath = path.join(imagesRoot, config.folder);
  const filePath = path.join(folderPath, fileName);
  const storagePath = `images/${config.folder}/${fileName}`;
  const contentType =
    image.type || (extension === ".png" ? "image/png" : "image/jpeg");
  const imageBuffer = Buffer.from(await image.arrayBuffer());

  await writeFile(filePath, imageBuffer);
  try {
    await uploadImageToSupabaseStorage(storagePath, imageBuffer, contentType);
  } catch (error) {
    console.error(error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo subir la imagen al storage de Supabase.",
      },
      { status: 500 },
    );
  }

  const metadata = await readMetadata();
  const nextProduct: MetadataProduct = {
    code,
    fileName,
    measureCode,
    name,
    originalFileName: image.name,
    originalPath: storagePath,
    priceOptions,
    themeId,
  };
  const products = [
    ...(metadata.products ?? []).filter((product) => product.code !== code),
    nextProduct,
  ];

  await writeFile(
    metadataPath,
    `${JSON.stringify({ products }, null, 2)}\n`,
    "utf8",
  );

  try {
    await regenerateProductAssets();
  } catch (error) {
    console.error(error);
    return Response.json(
      {
        code,
        error:
          "Se guardo la imagen, pero no se pudo regenerar el catalogo automaticamente.",
      },
      { status: 500 },
    );
  }

  return Response.json(
    {
      product: {
        code,
        fileName,
        measureCode,
        name,
      },
    },
    { status: 201 },
  );
}
