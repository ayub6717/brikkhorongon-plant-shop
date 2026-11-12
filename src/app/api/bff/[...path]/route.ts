import { callBackend, clientIp, forbidden, isSameOrigin, sessionToken, unreachable } from "@/lib/server/backend";

// Only these parts of the API are reachable through the proxy.
const ALLOWED = new Set(["me", "products", "orders", "admin", "reviews"]);

async function handle(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (!ALLOWED.has(path[0])) return Response.json({ code: "NOT_FOUND" }, { status: 404 });

  const mutating = req.method !== "GET";
  if (mutating && !isSameOrigin(req)) return forbidden();

  const token = await sessionToken();
  if (path[0] === "me") {
    // "Who am I?" with no cookie is a normal answer for a visitor, not an error: reply null without bothering the API.
    if (!token && req.method === "GET" && path.length === 1) return Response.json(null);
    if (!token) return Response.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }

  const target = `/api/${path.map(encodeURIComponent).join("/")}${new URL(req.url).search}`;
  let res: Response;
  try {
    res = await callBackend(target, { method: req.method, body: mutating ? await req.text() : undefined, token, ip: clientIp(req) });
  } catch {
    return unreachable();
  }

  return new Response(res.status === 204 ? null : await res.text(), {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
