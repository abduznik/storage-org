import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-helpers";
import {
  deleteItem,
  getItemById,
  updateItem,
  userCanAccessContainer,
} from "@/lib/containers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id, itemId } = await params;

  if (!userCanAccessContainer(auth.user.id, id)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const item = getItemById(Number(itemId));
  if (!item || item.container_id !== id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const fields: { name?: string; description?: string | null; quantity?: number | null } = {};
  if (typeof body?.name === "string" && body.name.trim()) fields.name = body.name.trim();
  if (body?.description !== undefined) {
    fields.description = body.description ? String(body.description).trim() : null;
  }
  if (body?.quantity !== undefined) {
    if (body.quantity === null || body.quantity === "") {
      fields.quantity = null;
    } else {
      const q = Number(body.quantity);
      fields.quantity = !Number.isNaN(q) && q >= 0 ? Math.floor(q) : null;
    }
  }

  updateItem(Number(itemId), fields);
  return NextResponse.json({ item: getItemById(Number(itemId)) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id, itemId } = await params;

  if (!userCanAccessContainer(auth.user.id, id)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const item = getItemById(Number(itemId));
  if (!item || item.container_id !== id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  deleteItem(Number(itemId));
  return NextResponse.json({ ok: true });
}
