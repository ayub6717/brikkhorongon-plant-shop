import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "bn"],
  defaultLocale: "en",
  // English lives at "/", Bangla at "/bn"
  localePrefix: "as-needed",
  // Always open in English unless the URL says /bn. Ignore browser language and the saved locale cookie.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
