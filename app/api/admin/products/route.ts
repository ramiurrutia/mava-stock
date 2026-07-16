import path from "node:path";
import {
  createCatalogProduct,
  deleteCatalogProduct,
  getCatalogProductByCode,
  getCatalogProductStoragePath,
  getDynamicStoragePath,
  getNextCatalogProductCode,
  updateCatalogProduct,
} from "@/lib/catalogProducts";
import { isAdminRequest } from "@/lib/adminAuth";
import type {
  ProductMeasureCode,
  ProductPriceOption,
} from "@/data/products";

export const runtime = "nodejs";

const storageBucket =
  process.env.SUPABASE_SOURCES_BUCKET ??
  process.env.NEXT_PUBLIC_SUPABASE_SOURCES_BUCKET ??
  "sources";
const storageCacheControl =
  process.env.SUPABASE_STORAGE_CACHE_CONTROL ??
  "public, max-age=31536000, immutable";
const validImageExtensions = new Set([".jpeg", ".jpg", ".png", ".webp"]);
const validPriceModes = new Set(["base", "blanco", "arpillera", "ambos"]);
const validMeasureCodes = new Set<ProductMeasureCode>([
  "DNG",
  "SG",
  "SGF",
  "TC",
  "TEXTURADO",
  "XG",
  "XGM",
]);

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

function getStorageHeaders(
  serviceRoleKey: string,
  extraHeaders: Record<string, string> = {},
) {
  return {
    apikey: serviceRoleKey,
    ...(serviceRoleKey.startsWith("sb_secret_")
      ? {}
      : { Authorization: `Bearer ${serviceRoleKey}` }),
    ...extraHeaders,
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
      headers: getStorageHeaders(config.serviceRoleKey, {
        "Cache-Control": storageCacheControl,
        "Content-Type": contentType,
      }),
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

async function deleteImageFromSupabaseStorage(storagePath: string) {
  const config = getSupabaseStorageConfig();

  if (!config) {
    throw new Error(
      "Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para borrar la imagen del storage.",
    );
  }

  const headers = getStorageHeaders(config.serviceRoleKey, {
    "Content-Type": "application/json",
  });
  const directResponse = await fetch(
    `${config.url}/storage/v1/object/${storageBucket}/${encodeStoragePath(storagePath)}`,
    {
      headers,
      method: "DELETE",
    },
  );

  if (directResponse.ok || directResponse.status === 404) {
    return;
  }

  const batchResponse = await fetch(
    `${config.url}/storage/v1/object/${storageBucket}`,
    {
      body: JSON.stringify({ prefixes: [storagePath] }),
      headers,
      method: "DELETE",
    },
  );

  if (!batchResponse.ok && batchResponse.status !== 404) {
    const details = await batchResponse.text().catch(() => "");

    throw new Error(
      details || "No se pudo borrar la imagen del storage de Supabase.",
    );
  }
}

async function moveImageInSupabaseStorage(
  sourcePath: string,
  destinationPath: string,
) {
  const config = getSupabaseStorageConfig();

  if (!config) {
    throw new Error(
      "Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para mover la imagen en storage.",
    );
  }

  const response = await fetch(`${config.url}/storage/v1/object/move`, {
    body: JSON.stringify({
      bucketId: storageBucket,
      destinationKey: destinationPath,
      sourceKey: sourcePath,
    }),
    headers: getStorageHeaders(config.serviceRoleKey, {
      "Content-Type": "application/json",
    }),
    method: "POST",
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");

    throw new Error(
      details || "No se pudo mover la imagen en el storage de Supabase.",
    );
  }
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function readMeasureCode(value: string): ProductMeasureCode | null {
  return validMeasureCodes.has(value as ProductMeasureCode)
    ? (value as ProductMeasureCode)
    : null;
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

  if (file.type === "image/webp") {
    return ".webp";
  }

  return "";
}

function readJpegDimensions(buffer: Buffer) {
  let offset = 2;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      break;
    }

    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);

    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    offset += 2 + length;
  }

  return null;
}

function readWebpDimensions(buffer: Buffer) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF") {
    return null;
  }

  let offset = 12;

  while (offset + 8 < buffer.length) {
    const chunkType = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;

    if (chunkType === "VP8X" && dataOffset + 10 <= buffer.length) {
      return {
        width:
          1 +
          buffer[dataOffset + 4] +
          (buffer[dataOffset + 5] << 8) +
          (buffer[dataOffset + 6] << 16),
        height:
          1 +
          buffer[dataOffset + 7] +
          (buffer[dataOffset + 8] << 8) +
          (buffer[dataOffset + 9] << 16),
      };
    }

    if (chunkType === "VP8 " && dataOffset + 10 <= buffer.length) {
      return {
        width: buffer.readUInt16LE(dataOffset + 6) & 0x3fff,
        height: buffer.readUInt16LE(dataOffset + 8) & 0x3fff,
      };
    }

    if (chunkType === "VP8L" && dataOffset + 5 <= buffer.length) {
      return {
        width:
          1 +
          buffer[dataOffset + 1] +
          ((buffer[dataOffset + 2] & 0x3f) << 8),
        height:
          1 +
          ((buffer[dataOffset + 2] & 0xc0) >> 6) +
          (buffer[dataOffset + 3] << 2) +
          ((buffer[dataOffset + 4] & 0x0f) << 10),
      };
    }

    offset += 8 + chunkSize + (chunkSize % 2);
  }

  return null;
}

function readImageDimensions(buffer: Buffer, extension: string) {
  if (extension === ".png" && buffer.length >= 24) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (extension === ".jpg" || extension === ".jpeg") {
    return readJpegDimensions(buffer);
  }

  if (extension === ".webp") {
    return readWebpDimensions(buffer);
  }

  return null;
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
  const priceOptions = readPriceOptions(formData);

  if (!(image instanceof File) || image.size === 0) {
    return Response.json({ error: "Subi una imagen" }, { status: 400 });
  }

  if (!measureCode) {
    return Response.json({ error: "Elegi una medida valida" }, { status: 400 });
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
      { error: "La imagen tiene que ser JPG, JPEG, PNG o WEBP" },
      { status: 400 },
    );
  }

  const contentType =
    image.type ||
    (extension === ".png"
      ? "image/png"
      : extension === ".webp"
        ? "image/webp"
        : "image/jpeg");
  const imageBuffer = Buffer.from(await image.arrayBuffer());
  const dimensions = readImageDimensions(imageBuffer, extension);

  if (!dimensions) {
    return Response.json(
      { error: "No se pudieron leer las medidas de la imagen" },
      { status: 400 },
    );
  }

  let storagePath = "";

  try {
    const code = await getNextCatalogProductCode(measureCode);
    const fileName = `${code}${extension}`;

    storagePath = getDynamicStoragePath(measureCode, fileName);
    await uploadImageToSupabaseStorage(storagePath, imageBuffer, contentType);
    const product = await createCatalogProduct({
      code,
      height: dimensions.height,
      measureCode,
      priceOptions,
      storagePath,
      themeId: "abstracto",
      width: dimensions.width,
    });

    if (!product) {
      throw new Error("No se pudo crear el item en el catalogo dinamico.");
    }

    return Response.json({ product }, { status: 201 });
  } catch (error) {
    if (storagePath) {
      await deleteImageFromSupabaseStorage(storagePath).catch(() => {});
    }
    console.error(error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo agregar el item.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!isAdminRequest(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const code = new URL(request.url).searchParams.get("code")?.trim();

  if (!code) {
    return Response.json({ error: "Falta el codigo del item" }, { status: 400 });
  }

  try {
    const storagePath = await getCatalogProductStoragePath(code);

    if (!storagePath) {
      return Response.json({
        product: {
          code,
        },
      });
    }

    const deleted = await deleteCatalogProduct(code);

    if (!deleted) {
      return Response.json({
        product: {
          code,
        },
      });
    }

    await deleteImageFromSupabaseStorage(storagePath);

    return Response.json({
      product: {
        code: deleted.code,
      },
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "No se pudo borrar el item",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return Response.json({ error: "Formulario invalido" }, { status: 400 });
  }

  const currentCode = readString(formData, "code").toUpperCase();
  const measureCode = readMeasureCode(readString(formData, "measureCode"));
  const priceOptions = readPriceOptions(formData);

  if (!currentCode) {
    return Response.json({ error: "Falta el codigo del item" }, { status: 400 });
  }

  if (!measureCode) {
    return Response.json({ error: "Elegi una medida valida" }, { status: 400 });
  }

  if (!priceOptions) {
    return Response.json(
      { error: "Completa el precio de la lamina" },
      { status: 400 },
    );
  }

  let movedToPath = "";
  let movedFromPath = "";

  try {
    const currentProduct = await getCatalogProductByCode(currentCode);

    if (!currentProduct) {
      return Response.json(
        { error: "No se encontro el item dinamico para editar" },
        { status: 404 },
      );
    }

    const shouldMoveMeasure = currentProduct.measureCode !== measureCode;
    const nextCode = shouldMoveMeasure
      ? await getNextCatalogProductCode(measureCode)
      : currentProduct.code;
    const extension = path.extname(currentProduct.storagePath) || ".jpg";
    const nextStoragePath = shouldMoveMeasure
      ? getDynamicStoragePath(measureCode, `${nextCode}${extension}`)
      : currentProduct.storagePath;

    if (shouldMoveMeasure) {
      movedFromPath = currentProduct.storagePath;
      movedToPath = nextStoragePath;
      await moveImageInSupabaseStorage(movedFromPath, movedToPath);
    }

    try {
      const product = await updateCatalogProduct({
        code: nextCode,
        currentCode: currentProduct.code,
        height: currentProduct.height,
        measureCode,
        priceOptions,
        storagePath: nextStoragePath,
        themeId: currentProduct.themeId,
        width: currentProduct.width,
      });

      if (!product) {
        throw new Error("No se pudo actualizar el item.");
      }

      return Response.json({
        previousCode: currentProduct.code,
        product,
      });
    } catch (error) {
      if (movedFromPath && movedToPath) {
        await moveImageInSupabaseStorage(movedToPath, movedFromPath).catch(
          () => {},
        );
      }

      throw error;
    }
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "No se pudo editar el item",
      },
      { status: 500 },
    );
  }
}
