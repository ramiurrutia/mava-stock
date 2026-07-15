import {
  CatalogProductsUnavailableError,
  getCatalogProducts,
} from "@/lib/catalogProducts";

const cacheHeaders = {
  "Cache-Control": "no-store",
};

export async function GET() {
  try {
    return Response.json(
      { products: await getCatalogProducts() },
      { headers: cacheHeaders },
    );
  } catch (error) {
    if (error instanceof CatalogProductsUnavailableError) {
      return Response.json({ products: [] }, { headers: cacheHeaders });
    }

    console.error(error);
    return Response.json(
      { error: "No se pudieron cargar los productos dinamicos." },
      { status: 500 },
    );
  }
}
