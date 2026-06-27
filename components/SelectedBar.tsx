import Link from "next/link";
import {
  formatPriceTotal,
  getProductPriceOptions,
  getSelectedPriceTotal,
  products,
  serializeSelectedPriceIds,
  type Product,
  type SelectedPriceIds,
} from "@/data/products";

type SelectedBarProps = {
  selectedIds: string[];
  selectedPriceIds: SelectedPriceIds;
  onClear: () => void;
};

export function SelectedBar({
  selectedIds,
  selectedPriceIds,
  onClear,
}: SelectedBarProps) {
  if (selectedIds.length === 0) {
    return null;
  }

  const totalPrice = getSelectedPriceTotal(selectedIds, selectedPriceIds);
  const selectedProducts = selectedIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product));
  const unpricedCount = selectedProducts.filter(
    (product) =>
      !getProductPriceOptions(product).some(
        (option) => option.id === selectedPriceIds[product.id],
      ),
  ).length;
  const selectedPriceParam = serializeSelectedPriceIds(
    selectedIds,
    selectedPriceIds,
  );
  const selectionParams = new URLSearchParams({
    ids: selectedIds.join(","),
  });

  if (selectedPriceParam) {
    selectionParams.set("prices", selectedPriceParam);
  }

  return (
    <div className="fixed inset-x-2 bottom-2 z-50 mx-auto max-w-2xl border border-neutral-950 bg-white p-1.5 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <div className="mb-1.5 h-1 bg-[#1f6f65]" />
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="grid min-w-0 grid-cols-[1fr_auto] items-center gap-2 px-1.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="bg-[#1f6f65] px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                Seleccion activa
              </span>
              <p className="text-sm font-semibold text-neutral-950">
                {selectedIds.length}{" "}
                {selectedIds.length === 1 ? "seleccionado" : "seleccionados"}
              </p>
            </div>

            <div className="mt-1 text-xs text-neutral-600">
              <span>
                Total:{" "}
                <strong className="font-semibold text-neutral-950">
                  {formatPriceTotal(totalPrice)}
                </strong>
              </span>
              {unpricedCount > 0 ? (
                <span className="ml-3">{unpricedCount} sin precio</span>
              ) : null}
            </div>
          </div>

            <button
              type="button"
              onClick={onClear}
              className="shrink-0 text-xs font-semibold text-neutral-500 underline-offset-4 transition hover:text-neutral-950 hover:underline"
            >
              Limpiar seleccion
            </button>
        </div>

        <Link
          href={`/seleccion?${selectionParams.toString()}`}
          className="flex h-10 items-center justify-center bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Finalizar pedido
        </Link>
      </div>
    </div>
  );
}
