"use client";

import { applyCatalog, type CatalogPayload } from "@/lib/catalog-state";

/**
 * Hands the server's live catalog to the browser-side code. It runs first in the tree, before any component that
 * reads the catalog, and renders nothing.
 */
export function CatalogHydrator({ payload }: Readonly<{ payload: CatalogPayload | null }>) {
  applyCatalog(payload);
  return null;
}
