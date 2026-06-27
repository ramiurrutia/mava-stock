import { isAdminRequest } from "@/lib/adminAuth";
import {
  createFinishedOrder,
  isAdminStoreUnavailableError,
} from "@/lib/adminStore";
import {
  deleteCustomerOrder,
  getCustomerOrders,
  isCustomerOrdersUnavailableError,
  updateCustomerOrderStatus,
} from "@/lib/customerOrders";
import { isOrderStatus } from "@/data/orders";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    return Response.json({
      orders: await getCustomerOrders(),
    });
  } catch (error) {
    if (isCustomerOrdersUnavailableError(error)) {
      return Response.json({ error: error.message }, { status: 503 });
    }

    console.error(error);
    return Response.json(
      { error: "No se pudieron cargar los pedidos" },
      { status: 500 },
    );
  }
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

  try {
    const store = await createFinishedOrder({
      productIds,
      productCodes,
      selectedPriceIds,
      totalInThousands,
      sharePath,
    });

    return Response.json(store);
  } catch (error) {
    if (isAdminStoreUnavailableError(error)) {
      return Response.json({ error: error.message }, { status: 503 });
    }

    console.error(error);
    return Response.json(
      { error: "No se pudo terminar el pedido" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    id?: unknown;
    status?: unknown;
  } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  const status = body?.status;

  if (!id || !isOrderStatus(status)) {
    return Response.json({ error: "Estado invalido" }, { status: 400 });
  }

  try {
    return Response.json({
      order: await updateCustomerOrderStatus(id, status),
    });
  } catch (error) {
    if (isCustomerOrdersUnavailableError(error)) {
      return Response.json({ error: error.message }, { status: 503 });
    }

    console.error(error);
    return Response.json(
      { error: "No se pudo actualizar el estado" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!isAdminRequest(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    id?: unknown;
  } | null;
  const id = typeof body?.id === "string" ? body.id : "";

  if (!id) {
    return Response.json({ error: "Pedido invalido" }, { status: 400 });
  }

  try {
    await deleteCustomerOrder(id);

    return Response.json({ deletedId: id });
  } catch (error) {
    if (isCustomerOrdersUnavailableError(error)) {
      return Response.json({ error: error.message }, { status: 503 });
    }

    console.error(error);
    return Response.json(
      { error: "No se pudo borrar el pedido" },
      { status: 500 },
    );
  }
}
