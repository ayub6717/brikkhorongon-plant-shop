import { cookies } from "next/headers";
import { callBackend, clientIp, forbidden, isSameOrigin, SESSION_COOKIE, unreachable } from "./backend";

/** Shared handler for login and register: forwards to the API, then stores the token in an httpOnly cookie. */
export function authHandler(kind: "login" | "register") {
  return async function POST(req: Request) {
    if (!isSameOrigin(req)) return forbidden();

    let res: Response;
    try {
      res = await callBackend(`/api/auth/${kind}`, { method: "POST", body: await req.text(), ip: clientIp(req) });
    } catch {
      return unreachable();
    }

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.token) {
      // Pass on only what the UI needs (an error code and field errors), never raw server details.
      return Response.json({ code: data?.code, errors: data?.errors }, { status: res.status });
    }

    (await cookies()).set(SESSION_COOKIE, data.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(data.expiresAt),
    });
    return Response.json(data.user); // the token itself is never sent to the page
  };
}
