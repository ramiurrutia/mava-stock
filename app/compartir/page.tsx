import { Suspense } from "react";
import { ShareSelectionClient } from "@/app/compartir/ShareSelectionClient";
import {
  getCustomerOrderById,
  isCustomerOrdersUnavailableError,
} from "@/lib/customerOrders";

type ShareSelectionPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function ShareSelectionPage({
  searchParams,
}: ShareSelectionPageProps) {
  const params = await searchParams;
  const orderId = readSearchParam(params.pedido).trim();
  let savedOrder = null;
  let savedOrderError = "";

  if (orderId) {
    try {
      savedOrder = await getCustomerOrderById(orderId);
      savedOrderError = savedOrder ? "" : "No encontramos ese pedido.";
    } catch (error) {
      savedOrderError = isCustomerOrdersUnavailableError(error)
        ? error.message
        : "No se pudo cargar el pedido.";
    }
  }

  return (
    <Suspense>
      <ShareSelectionClient
        orderId={orderId}
        savedOrder={savedOrder}
        savedOrderError={savedOrderError}
      />
    </Suspense>
  );
}
