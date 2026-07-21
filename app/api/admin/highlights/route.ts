import { isAdminRequest } from "@/lib/adminAuth";
import {
  setCatalogHighlight,
  type CatalogHighlightTargetType,
} from "@/lib/catalogHighlights";
import { productFolders } from "@/data/products";

const validFolderIds = new Set<string>(
  productFolders.map((folder) => folder.id),
);
const validMeasureCodes = new Set<string>(
  productFolders.flatMap((folder) =>
    folder.measures.map((measure) => measure.code),
  ),
);

function isTargetType(value: unknown): value is CatalogHighlightTargetType {
  return value === "folder" || value === "measure" || value === "product";
}

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    highlighted?: unknown;
    targetId?: unknown;
    targetType?: unknown;
  } | null;
  const targetType = body?.targetType;
  const targetId =
    typeof body?.targetId === "string" ? body.targetId.trim() : "";
  const highlighted = body?.highlighted === true;

  if (!isTargetType(targetType) || !targetId) {
    return Response.json({ error: "Destacado invalido" }, { status: 400 });
  }

  if (targetType === "folder" && !validFolderIds.has(targetId)) {
    return Response.json({ error: "Carpeta invalida" }, { status: 400 });
  }

  if (targetType === "measure" && !validMeasureCodes.has(targetId.toUpperCase())) {
    return Response.json({ error: "Medida invalida" }, { status: 400 });
  }

  try {
    const highlights = await setCatalogHighlight({
      highlighted,
      targetId,
      targetType,
    });

    return Response.json({ highlights });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar Lo mas vendido",
      },
      { status: 500 },
    );
  }
}
