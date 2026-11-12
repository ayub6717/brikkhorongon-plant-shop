import { cookies } from "next/headers";
import { forbidden, isSameOrigin, SESSION_COOKIE } from "@/lib/server/backend";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return forbidden();
  (await cookies()).delete(SESSION_COOKIE);
  return new Response(null, { status: 204 });
}
