import { isAdminRequest } from "@/lib/adminAuth";
import { getUnavailableProductIds, setProductsAvailability } from "@/lib/adminStore";

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

  return Response.json({
    unavailableProductIds: await setProductsAvailability(productIds, available),
  });
}
