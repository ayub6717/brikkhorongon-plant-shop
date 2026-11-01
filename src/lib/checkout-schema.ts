import { z } from "zod";
import { GIFT_CARDS } from "./gift";
import { DISTRICTS, PAYMENTS, SLOTS } from "./shipping";

/** Bangladeshi mobile: 01[3-9]XXXXXXXX with optional +88 / 88 prefix. */
export const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;

// Error messages are translation keys under Checkout.errors.
export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "name"),
  phone: z.string().trim().regex(BD_PHONE, "phone"),
  email: z.union([z.literal(""), z.email("email")]),
  district: z.enum(DISTRICTS, { error: "district" }),
  area: z.string().trim().min(2, "area"),
  address: z.string().trim().min(5, "address"),
  date: z.string().min(1, "date"),
  slot: z.enum(SLOTS, { error: "slot" }),
  payment: z.enum(PAYMENTS, { error: "payment" }),
  giftCard: z.enum(GIFT_CARDS),
  giftNote: z.string().trim().max(200, "tooLong"),
  note: z.string().trim().max(300, "tooLong"),
});

export type CheckoutValues = z.infer<typeof checkoutSchema>;
