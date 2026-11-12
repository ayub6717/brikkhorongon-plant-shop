import { recoveryHandler } from "@/lib/server/auth-route";

export const POST = recoveryHandler("forgot-password");
