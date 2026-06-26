import {
  isAdminRequest,
  isValidAdminPassword,
} from "@/lib/adminAuth";

export async function GET(request: Request) {
  return Response.json({
    authenticated: isAdminRequest(request),
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    password?: unknown;
  } | null;
  const password = typeof body?.password === "string" ? body.password : "";

  if (!isValidAdminPassword(password)) {
    return Response.json({ error: "Clave incorrecta" }, { status: 401 });
  }

  return Response.json({ authenticated: true });
}

export async function DELETE() {
  return Response.json({ authenticated: false });
}
