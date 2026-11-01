"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  /** Accessible name. Omit when a <label htmlFor={id}> points at this control. */
  label?: string;
  id?: string;
  /** Shown when `value` matches no option (e.g. "Choose a date"). */
  placeholder?: string;
  /** "pill" is the compact toolbar style; "field" fills its container like a form input. */
  variant?: "pill" | "field";
  invalid?: boolean;
  describedBy?: string;
  className?: string;
};

/** The site's one dropdown: a button + listbox that always opens below the trigger, unlike the native select popup. */
export function Select({ value, onChange, options, label, id, placeholder, variant = "pill", invalid, describedBy, className }: Readonly<Props>) {
  const auto = useId();
  const base = id ?? auto;
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selected = options.findIndex((o) => o.value === value);
  const field = variant === "field";
  let border = "border-border hover:border-primary/50";
  if (invalid) border = "border-accent";
  if (open) border = "border-primary";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const show = () => { setActive(Math.max(selected, 0)); setOpen(true); };
  const pick = (i: number) => { onChange(options[i].value); setOpen(false); trigger.current?.focus(); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); show(); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % options.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + options.length) % options.length); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(active); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setOpen(false); }
    else if (e.key === "Tab") setOpen(false);
  };

  return (
    <div ref={root} className={cn("relative", field && "w-full", className)}>
      <button
        ref={trigger}
        id={id}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${base}-list`}
        aria-activedescendant={open ? `${base}-${active}` : undefined}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        // The page-wide :focus-visible ring is unlayered and beats utility classes, so opt out inline.
        style={{ outline: "none" }}
        className={cn(
          "flex items-center gap-2 border bg-surface text-sm transition focus-visible:border-primary",
          field ? "w-full justify-between rounded-xl bg-background px-4 py-3 text-start" : "rounded-full py-2.5 pe-3 ps-4",
          border,
        )}
      >
        <span className={cn("truncate", selected < 0 && "text-muted-foreground")}>{selected >= 0 ? options[selected].label : placeholder}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <ul
          ref={list}
          id={`${base}-list`}
          role="listbox"
          aria-label={label}
          className={cn("absolute top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-border bg-background p-1 shadow-soft", field ? "inset-s-0 w-full" : "inset-e-0 min-w-full")}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${base}-${i}`}
              role="option"
              aria-selected={i === selected}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(i)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") pick(i); }}
              className={cn("flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm", !field && "whitespace-nowrap", i === active && "bg-muted", i === selected && "font-medium text-primary")}
            >
              <Check className={cn("size-4 shrink-0", i === selected ? "opacity-100" : "opacity-0")} aria-hidden />
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
