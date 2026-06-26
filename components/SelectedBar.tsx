import Link from "next/link";
import {
  priceOptions,
  serializeSelectedPriceIds,
  type SelectedPriceIds,
} from "@/data/products";

type SelectedBarProps = {
  selectedIds: string[];
  selectedPriceIds: SelectedPriceIds;
  onClear: () => void;
};

function formatTotal(amountInThousands: number) {
  if (amountInThousands < 1000) {
    return `$${amountInThousands}k`;
  }

  return `$${(amountInThousands * 1000).toLocaleString("es-AR")}`;
}

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
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl border border-neutral-200 bg-white p-2 shadow-2xl">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="min-w-0 px-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-neutral-950">
              {selectedIds.length}{" "}
              {selectedIds.length === 1 ? "seleccionado" : "seleccionados"}
            </p>
            <button
              type="button"
              onClick={onClear}
              className="shrink-0 text-xs font-semibold text-neutral-500 underline-offset-4 transition hover:text-neutral-950 hover:underline"
            >
              Limpiar seleccion
            </button>
          </div>

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-600">
            {selectedPriceCounts.some((option) => option.count > 0) ? (
              selectedPriceCounts.map((option) =>
                option.count > 0 ? (
                  <span key={option.id}>
                    {option.shortLabel} ({option.count}):{" "}
                    <strong className="font-semibold text-neutral-950">
                      {formatTotal(option.amountInThousands * option.count)}
                    </strong>
                  </span>
                ) : null,
              )
            ) : (
              <span>Sin precio elegido</span>
            )}
            {unpricedCount > 0 ? <span>{unpricedCount} sin precio</span> : null}
          </div>
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
