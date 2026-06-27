import { Suspense } from "react";
import { PrintChecklistClient } from "@/app/planilla/PrintChecklistClient";
import {
  getCustomerOrderById,
  isCustomerOrdersUnavailableError,
} from "@/lib/customerOrders";

type PrintChecklistPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function PrintChecklistPage({
  searchParams,
}: PrintChecklistPageProps) {
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
      <PrintChecklistClient
        orderId={orderId}
        savedOrder={savedOrder}
        savedOrderError={savedOrderError}
      />
    </Suspense>
  );
}
