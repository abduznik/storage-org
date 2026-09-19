import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  getUserByUsername,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = (body?.username || "").trim();
  const password = body?.password || "";
  const remember = !!body?.remember;

  const user = getUserByUsername(username);
  if (!user) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 }
    );
  }
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 }
    );
  }

  const session = createSession(user.id, remember);
  await setSessionCookie(session.id, remember);

  return NextResponse.json({ id: user.id, username: user.username });
}
