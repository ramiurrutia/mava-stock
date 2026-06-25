import { Suspense } from "react";
import { PrintChecklistClient } from "@/app/planilla/PrintChecklistClient";

export default function PrintChecklistPage() {
  return (
    <Suspense>
      <PrintChecklistClient />
    </Suspense>
  );
}
