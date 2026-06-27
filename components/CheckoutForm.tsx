"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createSelectionSearchParams,
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function getApiErrorMessage(response: Response) {
    const data = (await response.json().catch(() => null)) as
      | { error?: unknown }
      | null;

    return typeof data?.error === "string"
      ? data.error
      : "No se pudo guardar el pedido.";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const whatsapp = String(formData.get("whatsapp") ?? "").trim();
    const company = String(formData.get("company") ?? "").trim();
    const selectedIds = selectedProducts.map((product) => product.id);
    const selectionParams = createSelectionSearchParams(
      selectedIds,
      selectedPriceIds,
    );

    const fallbackSelectionUrl = `${window.location.origin}/compartir?${selectionParams.toString()}`;
    const mavaWhatsapp = process.env.NEXT_PUBLIC_MAVA_WHATSAPP?.replace(
      /\D/g,
      "",
    );

    const selectedCodes = selectedProducts
      .map((product) => product.code)
      .join(", ");

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/orders", {
        body: JSON.stringify({
          businessName: company,
          customerName: name,
          productIds: selectedIds,
          selectedPriceIds,
          whatsapp,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response));
      }

      const data = (await response.json()) as {
        order?: {
          id?: unknown;
        };
      };
      const orderId =
        typeof data.order?.id === "string" ? data.order.id : "";
      const shortOrderId = orderId.slice(0, 8).toUpperCase();
      const visualSelectionUrl = orderId
        ? `${window.location.origin}/compartir?pedido=${encodeURIComponent(orderId)}`
        : fallbackSelectionUrl;
      const message = [
        "Seleccione estos cuadros",
        shortOrderId ? `Pedido: #${shortOrderId}` : null,
        "",
        `Codigos: ${selectedCodes}`,
        "",
        "Mis datos:",
        `Nombre: ${name}`,
        `WhatsApp: ${whatsapp}`,
        company ? `Local / empresa: ${company}` : null,
        "",
        `Detalle visual: ${visualSelectionUrl}`,
      ]
        .filter(Boolean)
        .join("\n");
      const whatsappUrl = mavaWhatsapp
        ? `https://wa.me/${mavaWhatsapp}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;

      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      router.push(orderId ? `/gracias?pedido=${orderId}` : "/gracias");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo guardar el pedido.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-neutral-200 bg-white p-3 shadow-sm sm:p-4"
    >
      <div className="mb-4 border-b border-neutral-200 pb-3">
        <h2 className="text-base font-semibold">Datos para enviar</h2>
        <p className="mt-1 text-xs leading-5 text-neutral-500">
          Se abre WhatsApp con el pedido listo y un link visual para revisar la
          seleccion.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1.5 text-xs font-semibold text-neutral-700">
          Nombre
          <input
            name="name"
            required
            className="h-10 w-full border border-neutral-300 px-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
            autoComplete="name"
          />
        </label>

        <label className="space-y-1.5 text-xs font-semibold text-neutral-700">
          WhatsApp
          <input
            name="whatsapp"
            required
            className="h-10 w-full border border-neutral-300 px-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
            autoComplete="tel"
          />
        </label>

        <label className="space-y-1.5 text-xs font-semibold text-neutral-700">
          Local / empresa
          <input
            name="company"
            className="h-10 w-full border border-neutral-300 px-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
            autoComplete="organization"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {submitError ? (
          <p className="text-sm font-semibold text-red-600 sm:mr-auto">
            {submitError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={selectedProducts.length === 0 || submitting}
          className="h-10 w-full bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 sm:w-auto"
        >
          {submitting ? "Guardando pedido..." : "Compartir por WhatsApp"}
        </button>
      </div>
    </form>
  );
}
