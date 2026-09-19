import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-helpers";
import db from "@/lib/db";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const users = db
    .prepare("SELECT id, username FROM users WHERE id != ? ORDER BY username COLLATE NOCASE ASC")
    .all(auth.user.id) as { id: number; username: string }[];

  return NextResponse.json({ users });
}
