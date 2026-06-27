export const orderStatuses = [
  {
    id: "nuevo",
    label: "Nuevo",
  },
  {
    id: "para_armar",
    label: "Para armar",
  },
  {
    id: "listo",
    label: "Listo",
  },
  {
    id: "entregado",
    label: "Entregado",
  },
  {
    id: "cancelado",
    label: "Cancelado",
  },
] as const;

export type OrderStatus = (typeof orderStatuses)[number]["id"];

export type OrderItemSnapshot = {
  id: string;
  code: string;
  name: string;
  size: string;
  background: string;
  backgroundLabel: string;
  price: number;
};

export type CustomerOrder = {
  id: string;
  customerName: string;
  whatsapp: string;
  businessName: string;
  items: OrderItemSnapshot[];
  status: OrderStatus;
  total: number;
  createdAt: string;
};

export const orderStatusLabels = Object.fromEntries(
  orderStatuses.map((status) => [status.id, status.label]),
) as Record<OrderStatus, string>;

const validOrderStatuses = new Set<string>(
  orderStatuses.map((status) => status.id),
);

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && validOrderStatuses.has(value);
}
