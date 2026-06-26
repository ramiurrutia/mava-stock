"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FramePreview } from "@/components/FramePreview";
import {
  applyLocalStock,
  useAdminMode,
  useLocalStock,
} from "@/components/useAdminStock";
import {
  findPriceOption,
  parseSelectedPriceIds,
  products,
  serializeSelectedPriceIds,
} from "@/data/products";

export function PrintChecklistClient() {
  const searchParams = useSearchParams();
  const { isAdmin } = useAdminMode();
  const { unavailableProductIds } = useLocalStock();
  const ids =
    searchParams
      .get("ids")
      ?.split(",")
      .map((id) => id.trim())
      .filter(Boolean) ?? [];
  const selectedPriceIds = parseSelectedPriceIds(searchParams.get("prices"));
  const selectedPriceParam = serializeSelectedPriceIds(ids, selectedPriceIds);
  const shareParams = new URLSearchParams({
    ids: ids.join(","),
  });

  if (selectedPriceParam) {
    shareParams.set("prices", selectedPriceParam);
  }

  const productsWithLocalStock = applyLocalStock(products, unavailableProductIds);
  const selectedProducts = productsWithLocalStock.filter((product) =>
    ids.includes(product.id),
  );
  const today = new Intl.DateTimeFormat("es-AR").format(new Date());

  function printPage() {
    window.print();
  }

  return (
    <main className="print-page mx-auto w-full max-w-6xl px-4 py-8 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Link
          href={ids.length > 0 ? `/compartir?${shareParams.toString()}` : "/"}
          className="h-11 border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-950"
        >
          Volver
        </Link>
        {isAdmin ? (
          <button
            type="button"
            onClick={printPage}
            className="h-11 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Imprimir / guardar PDF
          </button>
        ) : null}
      </div>

      <section className="bg-white p-5 shadow-sm print:p-0 print:shadow-none">
        <header className="border-b border-neutral-300 pb-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase text-[#2f9c95]">
                Mava Cuadros
              </p>
              <h1 className="mt-1 text-2xl font-semibold">
                Planilla de seleccion de stock
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                Marcar cada cuadro cuando se retira del stock para armar el
                pedido.
              </p>
            </div>
            <div className="text-sm text-neutral-700">
              <p>
                <span className="font-semibold">Fecha:</span> {today}
              </p>
              <p>
                <span className="font-semibold">Cuadros:</span>{" "}
                {selectedProducts.length}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <BlankField label="Cliente" />
            <BlankField label="WhatsApp" />
            <BlankField label="Local / empresa" />
          </div>
        </header>

        {selectedProducts.length === 0 ? (
          <div className="py-12 text-center text-neutral-500">
            No hay cuadros para imprimir.
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 print:grid-cols-3">
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

        <footer className="mt-5 grid gap-3 border-t border-neutral-300 pt-4 text-sm sm:grid-cols-2">
          <BlankField label="Preparado por" />
          <BlankField label="Control final" />
        </footer>
      </section>
    </main>
  );
}

type ChecklistProductCardProps = {
  product: (typeof products)[number];
  index: number;
  selectedPriceId?: Parameters<typeof findPriceOption>[0];
};

function ChecklistProductCard({
  product,
  index,
  selectedPriceId,
}: ChecklistProductCardProps) {
  const selectedPrice = findPriceOption(selectedPriceId);

  return (
    <article className="break-inside-avoid border border-neutral-300 p-2">
      <div className="grid grid-cols-[72px_1fr] gap-3">
        <div className="w-18">
          <FramePreview product={product} selectedPriceId={selectedPriceId} />
        </div>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-neutral-500">
              #{index + 1}
            </p>
            <span
              className={`text-[10px] font-semibold uppercase ${
                product.available ? "text-[#2f9c95]" : "text-neutral-500"
              }`}
            >
              {product.available ? "Stock" : "Sin stock"}
            </span>
          </div>

          <h2 className="mt-1 text-base font-semibold leading-tight">
            {product.code}
          </h2>
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-neutral-700">
            {product.name}
          </p>
          <p className="mt-1 text-[11px] text-neutral-500">{product.size}</p>
          <p className="mt-1 text-[10px] font-semibold leading-tight text-neutral-800">
            {selectedPrice
              ? `${selectedPrice.shortLabel} ${selectedPrice.price}`
              : "Precio sin elegir"}
          </p>

          <div className="mt-3 flex items-center gap-2 border border-neutral-400 p-2">
            <span className="inline-block h-5 w-5 shrink-0 border-2 border-neutral-800" />
            <span className="text-xs font-semibold text-neutral-800">
              Seleccionado
            </span>
          </div>
        </div>
      </div>
    </article>
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
