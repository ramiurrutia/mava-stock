import { updateCatalogProductOrder } from "@/lib/catalogProducts";
import { isAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";

type ProductOrderRequest = {
  codes?: unknown;
};

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | ProductOrderRequest
    | null;
  const codes = Array.isArray(body?.codes)
    ? body.codes.filter((code): code is string => typeof code === "string")
    : [];

  if (codes.length === 0) {
    return Response.json(
      { error: "Falta la lista de codigos para ordenar" },
      { status: 400 },
    );
  }

  try {
    await updateCatalogProductOrder(codes);

    return Response.json({
      codes: codes.map((code) => code.trim().toUpperCase()).filter(Boolean),
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "No se pudo guardar el orden",
      },
      { status: 500 },
    );
  }
}
