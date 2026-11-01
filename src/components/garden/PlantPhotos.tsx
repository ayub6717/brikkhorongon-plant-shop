"use client";

import { Camera, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { fileToSmallJpeg } from "@/lib/image";
import { MAX_PHOTOS_PER_PLANT, useGardenPhotos } from "@/store/gardenPhotos";

const NONE: never[] = [];

/** Growth photos for one plant. Stays on this device. */
export function PlantPhotos({ slug, name, locale }: { slug: string; name: string; locale: string }) {
  const t = useTranslations("Garden");
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const photos = useGardenPhotos((s) => s.photos[slug]) ?? NONE;
  const add = useGardenPhotos((s) => s.add);
  const remove = useGardenPhotos((s) => s.remove);
  const [error, setError] = useState(false);
  const fmt = (iso: string) => new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { dateStyle: "medium" }).format(new Date(iso));

  const onFile = async (file?: File) => {
    if (!file) return;
    setError(false);
    try {
      const dataUrl = await fileToSmallJpeg(file);
      add(slug, { id: `${Date.now()}`, dataUrl, at: new Date().toISOString() });
      // Quota errors are swallowed by the persist middleware, so verify the write actually stuck.
      const saved = JSON.parse(localStorage.getItem("brikkhorongon-garden-photos") ?? "{}")?.state?.photos?.[slug];
      if (!saved?.length || saved[0].dataUrl !== dataUrl) setError(true);
    } catch {
      setError(true);
    } finally {
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      <ul className="flex flex-wrap items-center gap-2" aria-label={t("photos")}>
        {photos.map((p) => (
          <li key={p.id} className="group relative">
            <Image src={p.dataUrl} alt={t("photoOf", { name, date: fmt(p.at) })} width={48} height={48} unoptimized className="size-12 rounded-lg object-cover" />
            <button type="button" onClick={() => remove(slug, p.id)} aria-label={t("removePhoto")} className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-foreground text-background opacity-0 transition focus:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"><X className="size-3" aria-hidden /></button>
          </li>
        ))}
        {photos.length < MAX_PHOTOS_PER_PLANT && (
          <li>
            <label htmlFor={id} className="grid size-12 cursor-pointer place-items-center rounded-lg border border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-primary focus-within:border-primary">
              <Camera className="size-5" aria-hidden />
              <span className="sr-only">{t("addPhoto")}</span>
            </label>
            <input ref={input} id={id} type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </li>
        )}
      </ul>
      {error ? <p role="alert" className="mt-2 text-xs font-medium text-accent">{t("photoFull")}</p> : <p className="mt-2 text-xs text-muted-foreground">{t("photoHint")}</p>}
    </div>
  );
}
