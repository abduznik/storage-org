import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-helpers";
import {
  deleteContainer,
  getBreadcrumbPath,
  getContainerById,
  listChildContainers,
  listItemsForContainer,
  listShares,
  updateContainer,
  userCanAccessContainer,
  userOwnsContainer,
} from "@/lib/containers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const container = getContainerById(id);
  if (!container) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (!userCanAccessContainer(auth.user.id, id)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const items = listItemsForContainer(id);
  const children = listChildContainers(id, auth.user.id);
  const breadcrumbs = getBreadcrumbPath(id);
  const shares = userOwnsContainer(auth.user.id, id) ? listShares(id) : [];
  const isOwner = userOwnsContainer(auth.user.id, id);

  return NextResponse.json({ container, items, children, breadcrumbs, shares, isOwner });
}

export async function PATCH(
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
  const fields: { name?: string } = {};
  if (typeof body?.name === "string" && body.name.trim()) {
    fields.name = body.name.trim();
  }
  updateContainer(id, fields);
  return NextResponse.json({ container: getContainerById(id) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  if (!userOwnsContainer(auth.user.id, id)) {
    return NextResponse.json(
      { error: "Only the owner can delete this container." },
      { status: 403 }
    );
  }

  deleteContainer(id);
  return NextResponse.json({ ok: true });
}
