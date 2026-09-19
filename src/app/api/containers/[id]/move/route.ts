import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-helpers";
import { moveContainer, userCanAccessContainer, userOwnsContainer } from "@/lib/containers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  if (!userOwnsContainer(auth.user.id, id)) {
    return NextResponse.json(
      { error: "Only the owner can move this container." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const newParentId: string | null = body?.parent_container_id ?? null;

  if (newParentId && !userCanAccessContainer(auth.user.id, newParentId)) {
    return NextResponse.json(
      { error: "You don't have access to the target container." },
      { status: 403 }
    );
  }

  const result = moveContainer(id, newParentId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
