import { z } from "zod";
import { BD_PHONE } from "./checkout-schema";
import { DISTRICTS } from "./shipping";

// Error messages are translation keys under Account.errors.
export const loginSchema = z.object({ email: z.email("email"), password: z.string().min(1, "passwordRequired") });
export const registerSchema = z.object({
  name: z.string().trim().min(2, "name"),
  email: z.email("email"),
  phone: z.string().trim().regex(BD_PHONE, "phone"),
  // Mirrors the server rule: 8+ characters with at least one lowercase letter and one digit.
  password: z.string().min(8, "password").regex(/[a-z]/, "password").regex(/\d/, "password"),
});
export const addressSchema = z.object({
  label: z.string().trim().min(2, "label").max(30, "label"),
  district: z.enum(DISTRICTS, { error: "district" }),
  area: z.string().trim().min(2, "area"),
  address: z.string().trim().min(5, "address"),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type AddressValues = z.infer<typeof addressSchema>;
