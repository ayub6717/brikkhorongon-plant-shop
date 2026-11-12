import { httpAdmin, httpAuth, httpOrders, httpReviews } from "./http";
import { localApi } from "./local";
import type { ShopApi } from "./types";

/**
 * The single entry point for data. With NEXT_PUBLIC_USE_API=true, accounts are handled by the ASP.NET Core API
 * orders and reviews. Otherwise everything runs
 * in the browser, which is what the deployed demo site does today.
 */
export const usingServer = process.env.NEXT_PUBLIC_USE_API === "true";
export const api: ShopApi = usingServer ? { ...localApi, auth: httpAuth, orders: httpOrders, admin: httpAdmin, reviews: httpReviews } : localApi;
export * from "./types";
