import { NextResponse } from "next/server";
import { getCurrentUser, User } from "./auth";

export async function requireUser(): Promise<
  { user: User } | { error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user };
}
