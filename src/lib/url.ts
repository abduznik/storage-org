import { headers } from "next/headers";

// Builds the app's public base URL from the incoming request headers so QR
// codes always point at whatever host/proxy (Tailscale, Caddy, etc.) the
// request actually arrived through, instead of a hardcoded local address.
export async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const forwardedProto = h.get("x-forwarded-proto");
  const forwardedHost = h.get("x-forwarded-host");
  const host = forwardedHost || h.get("host") || "localhost:3000";
  const proto = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
