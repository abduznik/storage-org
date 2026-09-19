import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-helpers";
import { createItem, userCanAccessContainer } from "@/lib/containers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  if (!userCanAccessContainer(auth.user.id, id)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const name = (body?.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Item name is required." }, { status: 400 });
  }
  const description = body?.description ? String(body.description).trim() : null;
  let quantity: number | null = null;
  if (body?.quantity !== undefined && body?.quantity !== null && body?.quantity !== "") {
    const q = Number(body.quantity);
    if (!Number.isNaN(q) && q >= 0) quantity = Math.floor(q);
  }

  const item = createItem(id, name, description, quantity);
  return NextResponse.json({ item });
}
