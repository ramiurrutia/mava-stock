import Link from "next/link";
import {
  formatPriceTotal,
  getSelectedPriceTotal,
  priceOptions,
  serializeSelectedPriceIds,
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

  const selectedPriceCounts = priceOptions.map((option) => ({
    ...option,
    count: selectedIds.filter((id) => selectedPriceIds[id] === option.id).length,
  }));
  const totalPrice = getSelectedPriceTotal(selectedIds, selectedPriceIds);
  const unpricedCount = selectedIds.filter((id) => !selectedPriceIds[id]).length;
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
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl border border-neutral-950 bg-white p-2 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <div className="mb-2 h-1 bg-[#1f6f65]" />
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="grid min-w-0 grid-cols-[1fr_auto] items-center gap-3 px-2">
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
              {selectedPriceCounts.some((option) => option.count > 0) ? (
                <div className="space-y-0.5">
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {selectedPriceCounts.map((option) =>
                      option.count > 0 ? (
                        <span
                          key={option.id}
                          className="text-[11px] text-neutral-400"
                        >
                          {option.shortLabel} ({option.count}):{" "}
                          <strong className="font-medium text-neutral-500">
                            {formatPriceTotal(
                              option.amountInThousands * option.count,
                            )}
                          </strong>
                        </span>
                      ) : null,
                    )}
                    {unpricedCount > 0 ? (
                      <span className="text-[11px] text-neutral-400">
                        {unpricedCount} sin precio
                      </span>
                    ) : null}
                  </div>
                  <p>
                    Total:{" "}
                    <strong className="font-semibold text-neutral-950">
                      {formatPriceTotal(totalPrice)}
                    </strong>
                  </p>
                </div>
              ) : (
                <span>Sin precio elegido</span>
              )}
              {unpricedCount > 0 &&
              selectedPriceCounts.every((option) => option.count === 0) ? (
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
          className="flex h-11 items-center justify-center bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Revisar
        </Link>
      </div>
    </div>
  );
}
