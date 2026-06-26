import { isAdminRequest } from "@/lib/adminAuth";
import { createFinishedOrder, getFinishedOrders } from "@/lib/adminStore";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  return Response.json({
    orders: await getFinishedOrders(),
  });
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    productIds?: unknown;
    productCodes?: unknown;
    selectedPriceIds?: unknown;
    totalInThousands?: unknown;
    sharePath?: unknown;
  } | null;
  const productIds = Array.isArray(body?.productIds)
    ? body.productIds.filter((id): id is string => typeof id === "string")
    : [];
  const productCodes = Array.isArray(body?.productCodes)
    ? body.productCodes.filter((code): code is string => typeof code === "string")
    : [];
  const selectedPriceIds =
    body?.selectedPriceIds &&
    typeof body.selectedPriceIds === "object" &&
    !Array.isArray(body.selectedPriceIds)
      ? (body.selectedPriceIds as Record<string, string | undefined>)
      : {};
  const totalInThousands =
    typeof body?.totalInThousands === "number" ? body.totalInThousands : 0;
  const sharePath = typeof body?.sharePath === "string" ? body.sharePath : "";

  if (productIds.length === 0) {
    return Response.json({ error: "Sin productos" }, { status: 400 });
  }

  const store = await createFinishedOrder({
    productIds,
    productCodes,
    selectedPriceIds,
    totalInThousands,
    sharePath,
  });

  return Response.json(store);
}
