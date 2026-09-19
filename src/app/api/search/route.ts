import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-helpers";
import { searchContainersAndItems } from "@/lib/containers";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) {
    return NextResponse.json({ containers: [], items: [] });
  }

  const results = searchContainersAndItems(auth.user.id, q);
  return NextResponse.json(results);
}
