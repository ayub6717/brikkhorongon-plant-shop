import { authHandler } from "@/lib/server/auth-route";

export const POST = authHandler("login");
