import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import db from "./db";

export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface SessionRow {
  id: string;
  user_id: number;
  expires_at: string;
  created_at: string;
}

const SESSION_COOKIE = "session_id";
const SHORT_SESSION_DAYS = 1;
const REMEMBER_SESSION_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createUser(username: string, passwordHash: string): User {
  const stmt = db.prepare(
    "INSERT INTO users (username, password_hash) VALUES (?, ?)"
  );
  const info = stmt.run(username, passwordHash);
  return getUserById(info.lastInsertRowid as number)!;
}

export function getUserByUsername(username: string): User | undefined {
  return db
    .prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE")
    .get(username) as User | undefined;
}

export function getUserById(id: number): User | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | User
    | undefined;
}

export function createSession(userId: number, remember: boolean): SessionRow {
  const id = randomBytes(32).toString("hex");
  const days = remember ? REMEMBER_SESSION_DAYS : SHORT_SESSION_DAYS;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  db.prepare(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)"
  ).run(id, userId, expiresAt.toISOString());
  return {
    id,
    user_id: userId,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString(),
  };
}

export function deleteSession(sessionId: string) {
  db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

export function getSession(sessionId: string): SessionRow | undefined {
  const row = db
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .get(sessionId) as SessionRow | undefined;
  if (!row) return undefined;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    deleteSession(sessionId);
    return undefined;
  }
  return row;
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  const session = getSession(sessionId);
  if (!session) return null;
  const user = getUserById(session.user_id);
  return user || null;
}

export async function setSessionCookie(sessionId: string, remember: boolean) {
  const cookieStore = await cookies();
  const days = remember ? REMEMBER_SESSION_DAYS : SHORT_SESSION_DAYS;
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: days * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) deleteSession(sessionId);
  cookieStore.delete(SESSION_COOKIE);
}

export { SESSION_COOKIE };
