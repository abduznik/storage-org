import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-helpers";
import { addShare, removeShare, userOwnsContainer } from "@/lib/containers";
import { getUserByUsername } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  if (!userOwnsContainer(auth.user.id, id)) {
    return NextResponse.json(
      { error: "Only the owner can share this container." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const username = (body?.username || "").trim();
  const target = getUserByUsername(username);
  if (!target) {
    return NextResponse.json({ error: "No user with that username." }, { status: 404 });
  }
  if (target.id === auth.user.id) {
    return NextResponse.json({ error: "You already own this container." }, { status: 400 });
  }

  addShare(id, target.id);
  return NextResponse.json({ ok: true, user_id: target.id });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  if (!userOwnsContainer(auth.user.id, id)) {
    return NextResponse.json(
      { error: "Only the owner can modify sharing." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const userId = Number(body?.user_id);
  if (!userId) {
    return NextResponse.json({ error: "user_id is required." }, { status: 400 });
  }

  removeShare(id, userId);
  return NextResponse.json({ ok: true });
}
