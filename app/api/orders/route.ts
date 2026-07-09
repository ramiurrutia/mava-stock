import {
  createCustomerOrder,
  isCustomerOrdersUnavailableError,
} from "@/lib/customerOrders";
import { getCatalogProducts } from "@/lib/catalogProducts";
import {
  findPriceOption,
  products as staticProducts,
  type PriceOptionId,
  type Product,
  type SelectedPriceIds,
} from "@/data/products";

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseProductIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((id) => (typeof id === "string" ? id.trim() : ""))
        .filter(Boolean),
    ),
  );
}

function isPriceOptionId(value: unknown): value is PriceOptionId {
  return value === "blanco" || value === "arpillera" || value === "base";
}

function parseSelectedPriceIds(value: unknown): SelectedPriceIds {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce<SelectedPriceIds>(
    (current, [productId, priceId]) => {
      if (isPriceOptionId(priceId)) {
        current[productId] = priceId;
      }

      return current;
    },
    {},
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    businessName?: unknown;
    customerName?: unknown;
    productIds?: unknown;
    selectedPriceIds?: unknown;
    whatsapp?: unknown;
  } | null;
  const customerName = readString(body?.customerName);
  const whatsapp = readString(body?.whatsapp);
  const businessName = readString(body?.businessName);
  const productIds = parseProductIds(body?.productIds);
  const selectedPriceIds = parseSelectedPriceIds(body?.selectedPriceIds);

  if (!customerName || !whatsapp) {
    return Response.json(
      { error: "Completá nombre y WhatsApp para guardar el pedido." },
      { status: 400 },
    );
  }

  if (productIds.length === 0) {
    return Response.json(
      { error: "Seleccioná al menos un cuadro." },
      { status: 400 },
    );
  }

  const dynamicProducts = await getCatalogProducts().catch(() => []);
  const dynamicCodes = new Set(
    dynamicProducts.map((product) => product.code),
  );
  const allProducts = [
    ...staticProducts.filter((product) => !dynamicCodes.has(product.code)),
    ...dynamicProducts,
  ];
  const productsById = new Map(
    allProducts.map((product) => [product.id, product]),
  );
  const selectedProducts = productIds
    .map((productId) => productsById.get(productId))
    .filter((product): product is Product => Boolean(product));

  if (selectedProducts.length !== productIds.length) {
    return Response.json(
      { error: "El pedido tiene cuadros que ya no existen en el catálogo." },
      { status: 400 },
    );
  }

  const missingPriceProduct = selectedProducts.find(
    (product) => !findPriceOption(product, selectedPriceIds[product.id]),
  );

  if (missingPriceProduct) {
    return Response.json(
      {
        error: `Elegí el fondo o precio de ${missingPriceProduct.code} antes de finalizar.`,
      },
      { status: 400 },
    );
  }

  const items = selectedProducts.map((product) => {
    const price = findPriceOption(product, selectedPriceIds[product.id]);

    return {
      background: price?.id ?? "",
      backgroundLabel: price?.shortLabel ?? "",
      code: product.code,
      id: product.id,
      name: product.name,
      price: (price?.amountInThousands ?? 0) * 1000,
      size: product.size,
    };
  });
  const total = items.reduce((current, item) => current + item.price, 0);

  try {
    const order = await createCustomerOrder({
      businessName,
      customerName,
      items,
      total,
      whatsapp,
    });

    return Response.json({ order }, { status: 201 });
  } catch (error) {
    if (isCustomerOrdersUnavailableError(error)) {
      return Response.json({ error: error.message }, { status: 503 });
    }

    console.error(error);
    return Response.json(
      { error: "No se pudo guardar el pedido." },
      { status: 500 },
    );
  }
}
