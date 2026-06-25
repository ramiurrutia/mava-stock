import { Suspense } from "react";
import { ShareSelectionClient } from "@/app/compartir/ShareSelectionClient";

export default function ShareSelectionPage() {
  return (
    <Suspense>
      <ShareSelectionClient />
    </Suspense>
  );
}
