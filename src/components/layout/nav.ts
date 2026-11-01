export const NAV = [
  { href: "/shop", key: "shop" },
  { href: "/bonsai", key: "bonsai" },
  { href: "/learn", key: "learn" },
  { href: "/finder", key: "finder" },
  { href: "/doctor", key: "doctor" },
  { href: "/track", key: "track" },
] as const;

/** Secondary pages: shown in the mobile menu and the command palette, not the desktop bar. */
export const NAV_MORE = [
  { href: "/garden", key: "garden" },
  { href: "/wishlist", key: "wishlist" },
  { href: "/compare", key: "compare" },
] as const;
