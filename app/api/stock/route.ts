import { getUnavailableProductIds } from "@/lib/adminStore";

export async function GET() {
  return Response.json({
    unavailableProductIds: await getUnavailableProductIds(),
  });
}

