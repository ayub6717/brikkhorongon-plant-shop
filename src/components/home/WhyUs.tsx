import { HeartHandshake, MapPin, Scissors, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";

const ITEMS = [
  { key: "healthy", icon: ShieldCheck },
  { key: "care", icon: HeartHandshake },
  { key: "track", icon: MapPin },
  { key: "modify", icon: Scissors },
] as const;

export function WhyUs() {
  const t = useTranslations("Home.why");

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t("title")}</h2>
        <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
      </Reveal>
      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ key, icon: Icon }, i) => (
          <li key={key}>
            <Reveal delay={i * 0.07} className="h-full">
              <div className="h-full rounded-card border border-border bg-surface p-6">
                <span className="grid size-12 place-items-center rounded-2xl bg-muted text-primary">
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold">{t(`${key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`${key}.body`)}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
