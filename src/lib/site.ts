export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Absolute URL for a local path or an already-absolute remote image. */
export const absoluteUrl = (src: string) => (src.startsWith("http") ? src : `${SITE_URL}${src}`);
