"use client";

import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { MobileNavLinks } from "./NavLinks";

export function MobileNav() {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={t("menu")}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((v) => !v)}
        className="grid size-9 place-items-center sm:size-10 rounded-full text-foreground/80 transition hover:bg-muted"
      >
        {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
      </button>
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="absolute inset-x-0 top-16 border-b border-border bg-background px-4 pb-4 pt-2 shadow-soft"
        >
          <MobileNavLinks onNavigate={() => setOpen(false)} />
        </nav>
      )}
    </div>
  );
}
