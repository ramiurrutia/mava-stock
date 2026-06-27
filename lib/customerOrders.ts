import {
  isOrderStatus,
  type CustomerOrder,
  type OrderItemSnapshot,
  type OrderStatus,
} from "@/data/orders";

type SupabaseOrderRow = {
  id?: unknown;
  customer_name?: unknown;
  whatsapp?: unknown;
  business_name?: unknown;
  items?: unknown;
  status?: unknown;
  total?: unknown;
  created_at?: unknown;
};

type CreateCustomerOrderInput = {
  customerName: string;
  whatsapp: string;
  businessName: string;
  items: OrderItemSnapshot[];
  total: number;
};

const ordersTable = "orders";

export class CustomerOrdersUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerOrdersUnavailableError";
  }
}

export function isCustomerOrdersUnavailableError(
  error: unknown,
): error is CustomerOrdersUnavailableError {
  return error instanceof CustomerOrdersUnavailableError;
}

function getRemoteOrdersConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    serviceRoleKey,
    url: url.replace(/\/$/, ""),
  };
}

function getSupabaseHeaders(
  serviceRoleKey: string,
  extraHeaders: Record<string, string> = {},
) {
  const authHeaders: Record<string, string> = serviceRoleKey.startsWith(
    "sb_secret_",
  )
    ? {}
    : { Authorization: `Bearer ${serviceRoleKey}` };

  return {
    apikey: serviceRoleKey,
    "Content-Type": "application/json",
    ...authHeaders,
    ...extraHeaders,
  };
}

async function fetchSupabaseOrders(pathname: string, init: RequestInit = {}) {
  const config = getRemoteOrdersConfig();

  if (!config) {
    throw new CustomerOrdersUnavailableError(
      "Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const response = await fetch(`${config.url}/rest/v1/${pathname}`, {
    cache: "no-store",
    ...init,
    headers: getSupabaseHeaders(config.serviceRoleKey, {
      ...Object.fromEntries(new Headers(init.headers).entries()),
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");

    throw new CustomerOrdersUnavailableError(
      details || "No se pudo conectar con Supabase para guardar pedidos.",
    );
  }

  return response;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeOrderItems(value: unknown): OrderItemSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const parsed = item as Partial<OrderItemSnapshot>;

      return {
        background: readString(parsed.background),
        backgroundLabel: readString(parsed.backgroundLabel),
        code: readString(parsed.code),
        id: readString(parsed.id),
        name: readString(parsed.name),
        price: readNumber(parsed.price),
        size: readString(parsed.size),
      };
    })
    .filter((item): item is OrderItemSnapshot => Boolean(item?.id));
}

function normalizeCustomerOrder(row: SupabaseOrderRow): CustomerOrder {
  const status = isOrderStatus(row.status) ? row.status : "nuevo";

  return {
    businessName: readString(row.business_name),
    createdAt: readString(row.created_at),
    customerName: readString(row.customer_name),
    id: readString(row.id),
    items: normalizeOrderItems(row.items),
    status,
    total: readNumber(row.total),
    whatsapp: readString(row.whatsapp),
  };
}

export async function createCustomerOrder(input: CreateCustomerOrderInput) {
  const response = await fetchSupabaseOrders(
    `${ordersTable}?select=id,customer_name,whatsapp,business_name,items,status,total,created_at`,
    {
      body: JSON.stringify({
        business_name: input.businessName,
        customer_name: input.customerName,
        items: input.items,
        status: "nuevo",
        total: input.total,
        whatsapp: input.whatsapp,
      }),
      headers: {
        Prefer: "return=representation",
      },
      method: "POST",
    },
  );
  const rows = (await response.json()) as SupabaseOrderRow[];

  return normalizeCustomerOrder(rows[0] ?? {});
}

export async function getCustomerOrders() {
  const response = await fetchSupabaseOrders(
    `${ordersTable}?select=id,customer_name,whatsapp,business_name,items,status,total,created_at&order=created_at.desc&limit=200`,
  );
  const rows = (await response.json()) as SupabaseOrderRow[];

  return rows.map(normalizeCustomerOrder);
}

export async function getCustomerOrderById(id: string) {
  if (!id) {
    return null;
  }

  const response = await fetchSupabaseOrders(
    `${ordersTable}?id=eq.${encodeURIComponent(id)}&select=id,customer_name,whatsapp,business_name,items,status,total,created_at&limit=1`,
  );
  const rows = (await response.json()) as SupabaseOrderRow[];
  const row = rows[0];

  return row ? normalizeCustomerOrder(row) : null;
}

export async function updateCustomerOrderStatus(
  id: string,
  status: OrderStatus,
) {
  const response = await fetchSupabaseOrders(
    `${ordersTable}?id=eq.${encodeURIComponent(id)}&select=id,customer_name,whatsapp,business_name,items,status,total,created_at`,
    {
      body: JSON.stringify({ status }),
      headers: {
        Prefer: "return=representation",
      },
      method: "PATCH",
    },
  );
  const rows = (await response.json()) as SupabaseOrderRow[];

  return normalizeCustomerOrder(rows[0] ?? {});
}

export async function deleteCustomerOrder(id: string) {
  if (!id) {
    return;
  }

  await fetchSupabaseOrders(`${ordersTable}?id=eq.${encodeURIComponent(id)}`, {
    headers: {
      Prefer: "return=minimal",
    },
    method: "DELETE",
  });
}
