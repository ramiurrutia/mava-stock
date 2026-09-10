import { isAdminRequest } from "@/lib/adminAuth";
import {
  getStockState,
  isAdminStoreUnavailableError,
  setProductStockQuantity,
  setProductsAvailability,
} from "@/lib/adminStore";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    return Response.json(await getStockState());
  } catch {
    return Response.json({ error: "No se pudo cargar el stock" }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    productId?: unknown;
    quantity?: unknown;
    productIds?: unknown;
    available?: unknown;
  } | null;
  if (body && "quantity" in body) {
    if (typeof body.productId !== "string" || !body.productId.trim() ||
        typeof body.quantity !== "number" || !Number.isSafeInteger(body.quantity) ||
        body.quantity < 0 || body.quantity > 9999) {
      return Response.json({ error: "Cantidad invalida (0 a 9999)" }, { status: 400 });
    }
    try {
      await setProductStockQuantity(body.productId, body.quantity);
      return Response.json(await getStockState());
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "No se pudo guardar la cantidad" }, { status: 503 });
    }
  }
  const productIds = Array.isArray(body?.productIds)
    ? body.productIds.filter((id): id is string => typeof id === "string")
    : [];
  const available = body?.available === true;

  if (productIds.length === 0) {
    return Response.json({ error: "Sin productos" }, { status: 400 });
  }

  try {
    await setProductsAvailability(productIds, available);
    return Response.json(await getStockState());
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
