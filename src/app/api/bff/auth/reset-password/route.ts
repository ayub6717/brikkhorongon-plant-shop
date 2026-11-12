import { recoveryHandler } from "@/lib/server/auth-route";

export const POST = recoveryHandler("reset-password");
