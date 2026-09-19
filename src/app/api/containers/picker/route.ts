import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-helpers";
import { searchAccessibleContainersForPicker } from "@/lib/containers";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const q = req.nextUrl.searchParams.get("q") || "";
  const exclude = req.nextUrl.searchParams.get("exclude") || undefined;

  const containers = searchAccessibleContainersForPicker(auth.user.id, q, exclude);
  return NextResponse.json({ containers });
}
