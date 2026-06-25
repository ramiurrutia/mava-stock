import { Suspense } from "react";
import { SelectionClient } from "@/app/seleccion/SelectionClient";

export default function SelectionPage() {
  return (
    <Suspense>
      <SelectionClient />
    </Suspense>
  );
}
