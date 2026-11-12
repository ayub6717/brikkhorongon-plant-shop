import { cookies } from "next/headers";

/**
 * Server-only helpers for talking to the ASP.NET Core API.
 *
 * The browser never talks to the API directly. It calls /api/bff/* on this same site, and these route handlers
 * forward the request. That is the "backend for frontend" pattern, and it buys us three things:
 *  1. the login token lives in an httpOnly cookie, so page JavaScript (and any XSS bug) can never read it;
 *  2. no CORS setup between the two sites;
 *  3. the API address stays private (API_URL is not exposed to the browser).
 */
export const API_URL = process.env.API_URL ?? "http://localhost:5080";
export const SESSION_COOKIE = "brk_session";

export async function sessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export function callBackend(path: string, init: { method: string; body?: string; token?: string; ip?: string | null }) {
  const headers = new Headers({ Accept: "application/json" });
  if (init.body) headers.set("Content-Type", "application/json");
  if (init.token) headers.set("Authorization", `Bearer ${init.token}`);
  // Lets the API rate-limit by the real visitor, not by this server's address.
  if (init.ip) headers.set("X-Forwarded-For", init.ip);
  return fetch(`${API_URL}${path}`, { method: init.method, body: init.body, headers, cache: "no-store", signal: AbortSignal.timeout(10_000) });
}

/** Blocks cross-site form posts: a browser-sent Origin must match this site. */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser callers (curl, server-to-server) send none
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

export const forbidden = () => Response.json({ code: "FORBIDDEN" }, { status: 403 });
export const unreachable = () => Response.json({ code: "NETWORK" }, { status: 502 });
