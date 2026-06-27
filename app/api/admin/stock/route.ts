import { isAdminRequest } from "@/lib/adminAuth";
import {
  getUnavailableProductIds,
  isAdminStoreUnavailableError,
  setProductsAvailability,
} from "@/lib/adminStore";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  return Response.json({
    unavailableProductIds: await getUnavailableProductIds(),
  });
}

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    productIds?: unknown;
    available?: unknown;
  } | null;
  const productIds = Array.isArray(body?.productIds)
    ? body.productIds.filter((id): id is string => typeof id === "string")
    : [];
  const available = body?.available === true;

  if (productIds.length === 0) {
    return Response.json({ error: "Sin productos" }, { status: 400 });
  }

  try {
    return Response.json({
      unavailableProductIds: await setProductsAvailability(
        productIds,
        available,
      ),
    });
  } catch (error) {
    if (isAdminStoreUnavailableError(error)) {
      return Response.json({ error: error.message }, { status: 503 });
    }

    console.error(error);
    return Response.json(
      { error: "No se pudo actualizar el stock" },
      { status: 500 },
    );
  }
}
