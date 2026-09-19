import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  createUser,
  getUserByUsername,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = (body?.username || "").trim();
  const password = body?.password || "";
  const remember = !!body?.remember;

  if (!username || username.length < 3) {
    return NextResponse.json(
      { error: "Username must be at least 3 characters." },
      { status: 400 }
    );
  }
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }
  if (getUserByUsername(username)) {
    return NextResponse.json(
      { error: "That username is already taken." },
      { status: 409 }
    );
  }

  const hash = await hashPassword(password);
  const user = createUser(username, hash);
  const session = createSession(user.id, remember);
  await setSessionCookie(session.id, remember);

  return NextResponse.json({ id: user.id, username: user.username });
}
