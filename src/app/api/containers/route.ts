import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-helpers";
import {
  createContainer,
  listContainersForUser,
  userCanAccessContainer,
} from "@/lib/containers";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const containers = listContainersForUser(auth.user.id);
  return NextResponse.json({ containers });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const name = (body?.name || "").trim();
  const parentContainerId = body?.parent_container_id || null;

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  if (parentContainerId && !userCanAccessContainer(auth.user.id, parentContainerId)) {
    return NextResponse.json(
      { error: "You don't have access to that parent container." },
      { status: 403 }
    );
  }

  const container = createContainer(auth.user.id, name, null, parentContainerId);
  return NextResponse.json({ container });
}
