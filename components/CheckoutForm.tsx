"use client";

import { useRouter } from "next/navigation";
import {
  findPriceOption,
  priceOptions,
  serializeSelectedPriceIds,
  type Product,
  type SelectedPriceIds,
} from "@/data/products";

type CheckoutFormProps = {
  selectedProducts: Product[];
  selectedPriceIds: SelectedPriceIds;
};

export function CheckoutForm({
  selectedProducts,
  selectedPriceIds,
}: CheckoutFormProps) {
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const whatsapp = String(formData.get("whatsapp") ?? "").trim();
    const company = String(formData.get("company") ?? "").trim();
    const selectedIds = selectedProducts.map((product) => product.id);
    const selectionParams = new URLSearchParams({
      ids: selectedIds.join(","),
    });
    const selectedPriceParam = serializeSelectedPriceIds(
      selectedIds,
      selectedPriceIds,
    );

    if (selectedPriceParam) {
      selectionParams.set("prices", selectedPriceParam);
    }

    const visualSelectionUrl = `${window.location.origin}/compartir?${selectionParams.toString()}`;
    const mavaWhatsapp = process.env.NEXT_PUBLIC_MAVA_WHATSAPP?.replace(
      /\D/g,
      "",
    );

    const productLines = selectedProducts
      .map((product, index) => {
        const selectedPrice = findPriceOption(selectedPriceIds[product.id]);
        const priceLabel = selectedPrice
          ? `${selectedPrice.label} ${selectedPrice.price}`
          : "Precio sin elegir";

        return `${index + 1}. ${product.code} - ${product.name} (${product.size}) - ${priceLabel}`;
      })
      .join("\n");
    const priceLines = priceOptions
      .map((option) => `${option.label}: ${option.price}`)
      .join("\n");

    const message = [
      "Seleccione estos cuadros",
      "",
      productLines,
      "",
      "Precios:",
      priceLines,
      "",
      "Mis datos:",
      `Nombre: ${name}`,
      `WhatsApp: ${whatsapp}`,
      company ? `Local / empresa: ${company}` : null,
      "",
      `Seleccion visual: ${visualSelectionUrl}`,
    ]
      .filter(Boolean)
      .join("\n");

    const whatsappUrl = mavaWhatsapp
      ? `https://wa.me/${mavaWhatsapp}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    router.push("/gracias");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-neutral-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="mb-5 border-b border-neutral-200 pb-4">
        <h2 className="text-lg font-semibold">Datos para enviar</h2>
        <p className="mt-1 text-sm leading-6 text-neutral-500">
          Se abre WhatsApp con el pedido listo y un link visual para revisar la
          seleccion.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm font-semibold text-neutral-700">
          Nombre
          <input
            name="name"
            required
            className="h-12 w-full border border-neutral-300 px-3 text-base text-neutral-950 outline-none transition focus:border-neutral-950"
            autoComplete="name"
          />
        </label>

        <label className="space-y-2 text-sm font-semibold text-neutral-700">
          WhatsApp
          <input
            name="whatsapp"
            required
            className="h-12 w-full border border-neutral-300 px-3 text-base text-neutral-950 outline-none transition focus:border-neutral-950"
            autoComplete="tel"
          />
        </label>

        <label className="space-y-2 text-sm font-semibold text-neutral-700">
          Local / empresa
          <input
            name="company"
            className="h-12 w-full border border-neutral-300 px-3 text-base text-neutral-950 outline-none transition focus:border-neutral-950"
            autoComplete="organization"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={selectedProducts.length === 0}
        className="mt-5 h-12 w-full bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        Compartir por WhatsApp
      </button>
    </form>
  );
}
