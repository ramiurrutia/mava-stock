"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FramePreview } from "@/components/FramePreview";
import { useCatalogProducts } from "@/components/useCatalogProducts";
import {
  applyLocalStock,
  useAdminMode,
  useLocalStock,
} from "@/components/useAdminStock";
import type { CustomerOrder } from "@/data/orders";
import {
  createSelectionSearchParams,
  findPriceOption,
  formatPriceTotal,
  parseSelectionParams,
  type PriceOptionId,
  type Product,
} from "@/data/products";

type PrintChecklistClientProps = {
  backTarget?: "admin" | "pedido";
  orderId?: string;
  savedOrder?: CustomerOrder | null;
  savedOrderError?: string;
};

export function PrintChecklistClient({
  backTarget = "pedido",
  orderId = "",
  savedOrder = null,
  savedOrderError = "",
}: PrintChecklistClientProps) {
  if (orderId) {
    return (
      <SavedOrderChecklist
        backTarget={backTarget}
        order={savedOrder}
        orderError={savedOrderError}
        orderId={orderId}
      />
    );
  }

  return <TemporarySelectionChecklist />;
}

function TemporarySelectionChecklist() {
  const searchParams = useSearchParams();
  const { isAdmin } = useAdminMode();
  const { unavailableProductIds } = useLocalStock();
  const catalogProducts = useCatalogProducts();
  const { ids, selectedPriceIds } = parseSelectionParams(searchParams);
  const shareParams = createSelectionSearchParams(ids, selectedPriceIds);

  const productsWithLocalStock = applyLocalStock(
    catalogProducts,
    unavailableProductIds,
  );
  const selectedProducts = productsWithLocalStock.filter((product) =>
    ids.includes(product.id),
  );
  const today = new Intl.DateTimeFormat("es-AR").format(new Date());

  function printPage() {
    window.print();
  }

  return (
    <ChecklistShell
      backHref={ids.length > 0 ? `/compartir?${shareParams.toString()}` : "/"}
      backLabel="Volver"
      canPrint={isAdmin}
      onPrint={printPage}
    >
      <ChecklistHeader
        count={selectedProducts.length}
        dateLabel={today}
        fields={[
          { label: "Cliente" },
          { label: "WhatsApp" },
          { label: "Local / empresa" },
        ]}
      />

      {selectedProducts.length === 0 ? (
        <EmptyChecklist message="No hay cuadros para imprimir." />
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 print:grid-cols-3 print:gap-2">
          {selectedProducts.map((product, index) => (
            <ChecklistProductCard
              key={product.id}
              product={product}
              index={index}
              selectedPriceId={selectedPriceIds[product.id]}
            />
          ))}
        </div>
      )}

      <ChecklistFooter />
    </ChecklistShell>
  );
}

type SavedOrderChecklistProps = {
  backTarget: "admin" | "pedido";
  order: CustomerOrder | null;
  orderError: string;
  orderId: string;
};

function SavedOrderChecklist({
  backTarget,
  order,
  orderError,
  orderId,
}: SavedOrderChecklistProps) {
  const { isAdmin } = useAdminMode();
  const catalogProducts = useCatalogProducts();
  const today = new Intl.DateTimeFormat("es-AR").format(new Date());
  const backHref =
    order && backTarget === "pedido"
      ? `/compartir?pedido=${encodeURIComponent(order.id)}`
      : "/admin";
  const backLabel =
    backTarget === "admin" || !order ? "Volver al admin" : "Volver al pedido";

  function printPage() {
    window.print();
  }

  return (
    <ChecklistShell
      backHref={backHref}
      backLabel={backLabel}
      canPrint={isAdmin && Boolean(order)}
      onPrint={printPage}
    >
      {!order ? (
        <EmptyChecklist
          message={orderError || `No hay pedido guardado para ${orderId}.`}
        />
      ) : (
        <>
          <ChecklistHeader
            count={order.items.length}
            dateLabel={today}
            fields={[
              { label: "Cliente", value: order.customerName },
              { label: "WhatsApp", value: order.whatsapp },
              { label: "Local / empresa", value: order.businessName },
            ]}
            subtitle={`Pedido #${getShortOrderId(order.id)} - ${formatOrderDate(
              order.createdAt,
            )}`}
          />

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 print:grid-cols-3 print:gap-2">
            {order.items.map((item, index) => (
              <ChecklistOrderItemCard
                key={`${item.id}-${index}`}
                item={item}
                index={index}
                products={catalogProducts}
              />
            ))}
          </div>

          <ChecklistFooter />
        </>
      )}
    </ChecklistShell>
  );
}

type ChecklistShellProps = {
  backHref: string;
  backLabel: string;
  canPrint: boolean;
  children: React.ReactNode;
  onPrint: () => void;
};

function ChecklistShell({
  backHref,
  backLabel,
  canPrint,
  children,
  onPrint,
}: ChecklistShellProps) {
  return (
    <main className="print-page mx-auto w-full max-w-6xl px-4 py-8 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Link
          href={backHref}
          className="h-11 border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-950"
        >
          {backLabel}
        </Link>
        {canPrint ? (
          <button
            type="button"
            onClick={onPrint}
            className="h-11 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Imprimir / guardar PDF
          </button>
        ) : null}
      </div>

      <section className="bg-white p-5 shadow-sm print:p-0 print:shadow-none">
        {children}
      </section>
    </main>
  );
}

type ChecklistHeaderProps = {
  count: number;
  dateLabel: string;
  fields: {
    label: string;
    value?: string;
  }[];
  subtitle?: string;
};

function ChecklistHeader({
  count,
  dateLabel,
  fields,
  subtitle,
}: ChecklistHeaderProps) {
  return (
    <header className="border-b border-neutral-300 pb-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase text-[#7E5E35]">
            Mava Cuadros
          </p>
          <h1 className="mt-1 text-2xl font-semibold">
            Planilla de seleccion de stock
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {subtitle ||
              "Marcar cada cuadro cuando se retira del stock para armar el pedido."}
          </p>
        </div>
        <div className="text-sm text-neutral-700">
          <p>
            <span className="font-semibold">Fecha:</span> {dateLabel}
          </p>
          <p>
            <span className="font-semibold">Cuadros:</span> {count}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {fields.map((field) =>
          field.value ? (
            <FilledField
              key={field.label}
              label={field.label}
              value={field.value}
            />
          ) : (
            <BlankField key={field.label} label={field.label} />
          ),
        )}
      </div>
    </header>
  );
}

function EmptyChecklist({ message }: { message: string }) {
  return <div className="py-12 text-center text-neutral-500">{message}</div>;
}

function ChecklistFooter() {
  return (
    <footer className="mt-5 grid gap-3 border-t border-neutral-300 pt-4 text-sm sm:grid-cols-2">
      <NotesField />
      <BlankField label="Preparado por" />
      <BlankField label="Control final" />
    </footer>
  );
}

function NotesField() {
  return (
    <label className="block border border-neutral-300 p-2 sm:col-span-2">
      <span className="text-xs font-semibold uppercase text-neutral-500">
        Observaciones / notas
      </span>
      <textarea
        aria-label="Observaciones o notas"
        className="mt-2 block min-h-24 w-full resize-none bg-transparent text-sm leading-6 text-neutral-950 outline-none print:min-h-28"
      />
    </label>
  );
}

type ChecklistProductCardProps = {
  product: Product;
  index: number;
  selectedPriceId?: PriceOptionId;
};

function ChecklistProductCard({
  product,
  index,
  selectedPriceId,
}: ChecklistProductCardProps) {
  const selectedPrice = findPriceOption(product, selectedPriceId);

  return (
    <article className="break-inside-avoid border border-neutral-300 p-1.5">
      <div className="grid grid-cols-[58px_1fr] gap-2">
        <div className="w-[58px]">
          <FramePreview product={product} selectedPriceId={selectedPriceId} />
        </div>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-semibold text-neutral-500">
              #{index + 1}
            </p>
            <span
              className={`text-[10px] font-semibold uppercase ${
                product.available ? "text-[#7E5E35]" : "text-neutral-500"
              }`}
            >
              {product.available ? "Stock" : "Sin stock"}
            </span>
          </div>

          <h2 className="mt-0.5 text-sm font-semibold leading-tight">
            {product.code}
          </h2>
          <p className="mt-0.5 text-[10px] text-neutral-500">{product.size}</p>
          <p className="mt-0.5 text-[10px] font-semibold leading-tight text-neutral-800">
            {selectedPrice
              ? `${selectedPrice.shortLabel} ${formatPriceTotal(
                  selectedPrice.amountInThousands,
                )}`
              : "Precio sin elegir"}
          </p>
        </div>
      </div>

      <ChecklistActions />
    </article>
  );
}

type ChecklistOrderItemCardProps = {
  index: number;
  item: CustomerOrder["items"][number];
  products: Product[];
};

function ChecklistOrderItemCard({
  index,
  item,
  products,
}: ChecklistOrderItemCardProps) {
  const product = products.find((current) => current.id === item.id);
  const selectedPriceId = isPriceOptionId(item.background)
    ? item.background
    : undefined;

  return (
    <article className="break-inside-avoid border border-neutral-300 p-1.5">
      <div className="grid grid-cols-[58px_1fr] gap-2">
        <div className="w-[58px]">
          {product ? (
            <FramePreview product={product} selectedPriceId={selectedPriceId} />
          ) : (
            <div className="grid aspect-[4/5] place-items-center border border-dashed border-neutral-300 bg-neutral-50 px-1 text-center">
              <span className="text-[10px] font-semibold text-neutral-500">
                {item.code}
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-semibold text-neutral-500">
              #{index + 1}
            </p>
            <span className="text-[10px] font-semibold uppercase text-[#7E5E35]">
              Pedido
            </span>
          </div>

          <h2 className="mt-0.5 text-sm font-semibold leading-tight">
            {item.code}
          </h2>
          <p className="mt-0.5 text-[10px] text-neutral-500">{item.size}</p>
          <p className="mt-0.5 text-[10px] font-semibold leading-tight text-neutral-800">
            {item.backgroundLabel || "Precio"} {formatMoney(item.price)}
          </p>
        </div>
      </div>

      <ChecklistActions />
    </article>
  );
}

function ChecklistActions() {
  return (
    <div className="mt-1.5 grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-1.5">
      <ChecklistStatus label="Para armar" />
      <ChecklistStatus label="Listo" />
    </div>
  );
}

type ChecklistStatusProps = {
  label: string;
};

function ChecklistStatus({ label }: ChecklistStatusProps) {
  return (
    <div className="flex min-h-7 items-center gap-1.5 border border-neutral-400 px-1.5 py-0.5">
      <span className="inline-block h-3.5 w-3.5 shrink-0 border-2 border-neutral-800" />
      <span className="whitespace-nowrap text-[10px] font-semibold leading-tight text-neutral-800">
        {label}
      </span>
    </div>
  );
}

type BlankFieldProps = {
  label: string;
};

function BlankField({ label }: BlankFieldProps) {
  return (
    <div className="min-h-10 border border-neutral-300 p-2">
      <p className="text-xs font-semibold uppercase text-neutral-500">{label}</p>
    </div>
  );
}

type FilledFieldProps = {
  label: string;
  value: string;
};

function FilledField({ label, value }: FilledFieldProps) {
  return (
    <div className="min-h-10 border border-neutral-300 p-2">
      <p className="text-xs font-semibold uppercase text-neutral-500">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-tight text-neutral-950">
        {value}
      </p>
    </div>
  );
}

function isPriceOptionId(value: string): value is PriceOptionId {
  return value === "blanco" || value === "arpillera" || value === "base";
}

function formatMoney(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}

function formatOrderDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getShortOrderId(id: string) {
  return id.slice(0, 8).toUpperCase();
}
