import { cache } from "react";
import { applyCatalog, type CatalogPayload } from "@/lib/catalog-state";
import { API_URL } from "./backend";

/** Cache label: the BFF clears it whenever the shop team changes something, so edits show up straight away. */
export const CATALOG_TAG = "catalog";

async function load(): Promise<CatalogPayload | null> {
  if (process.env.NEXT_PUBLIC_USE_API !== "true") return null; // browser-only demo: the static catalog is the catalog
  try {
    const res = await fetch(`${API_URL}/api/catalog`, {
      next: { revalidate: 60, tags: [CATALOG_TAG] },
      // The free host sleeps when idle and takes up to ~50 s to wake; past this we show the built-in catalog instead of hanging.
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok ? ((await res.json()) as CatalogPayload) : null;
  } catch {
    return null;
  }
}

/**
 * Loads the live catalog and makes it the one that getAllProducts() & co. read (server side).
 * Every server page that shows plants awaits this first. Falls back to the built-in catalog if the API can't be reached.
 */
export const ensureCatalog = cache(async (): Promise<CatalogPayload | null> => {
  const payload = await load();
  applyCatalog(payload);
  return payload;
});
