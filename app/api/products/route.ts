import {
  CatalogProductsUnavailableError,
  getCatalogProducts,
} from "@/lib/catalogProducts";
import {
  emptyCatalogHighlights,
  getCatalogHighlights,
} from "@/lib/catalogHighlights";

const cacheHeaders = {
  "Cache-Control": "no-store",
};

export async function GET() {
  try {
    const [products, highlights] = await Promise.all([
      getCatalogProducts(),
      getCatalogHighlights().catch(() => emptyCatalogHighlights),
    ]);

    return Response.json(
      { highlights, products },
      { headers: cacheHeaders },
    );
  } catch (error) {
    if (error instanceof CatalogProductsUnavailableError) {
      return Response.json(
        { highlights: emptyCatalogHighlights, products: [] },
        { headers: cacheHeaders },
      );
    }

    console.error(error);
    return Response.json(
      { error: "No se pudieron cargar los productos dinamicos." },
      { status: 500 },
    );
  }
}
