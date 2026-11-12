"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Upload } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import type { BonsaiStyle, CategorySlug, Difficulty, Light, Placement, Water } from "@/data/types";
import { adminApi, type AdminProduct, type BulkInput, type ProductInput } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";
import { BONSAI_STYLES, CATEGORY_SLUGS, LEVELS, LIGHTS, PLACEMENTS } from "@/lib/catalog";
import { downloadText, parseCsv, toCsv } from "@/lib/csv";
import { prepareImage } from "@/lib/image-upload";
import { Badge, ErrorLine, Field, Notice, PageHeader, btn, btnDanger, btnPrimary, card, errorMessage, input, money, num, todayKey, useAdminQuery, useCan } from "./ui";

const WATERS: Water[] = ["low", "moderate", "high"];
const cap = (s: string) => s.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
const CSV_HEADER = ["slug", "nameEn", "nameBn", "descriptionEn", "descriptionBn", "category", "price", "stock", "hidden", "featured", "imageSrc", "imageWidth", "imageHeight",
  "light", "water", "difficulty", "bonsaiStyle", "bonsaiAgeYears", "bonsaiHeightCm", "bonsaiPlacement"];

function useRefresh() {
  const qc = useQueryClient();
  return () => Promise.all([qc.invalidateQueries({ queryKey: ["admin", "products"] }), qc.invalidateQueries({ queryKey: ["admin", "stats"] }), qc.invalidateQueries({ queryKey: ["admin", "analytics"] })]);
}

// ============================ Product list ============================
export function ProductsPage() {
  const canWrite = useCan("Admin", "Manager");
  const refresh = useRefresh();
  const [filters, setFilters] = useState({ q: "", category: "", stock: "", hidden: "" });
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [bulk, setBulk] = useState({ priceMode: "", priceValue: "", stockMode: "", stockValue: "", visibility: "" });
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const list = useAdminQuery(["products", filters], () => adminApi.products({ q: filters.q, category: filters.category, stock: filters.stock, hidden: filters.hidden === "" ? undefined : filters.hidden === "true" }));
  const items = list.data ?? [];
  const toggle = (id: number) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const allPicked = items.length > 0 && items.every((p) => picked.has(p.id));

  const hide = useMutation({ mutationFn: (v: { id: number; hidden: boolean }) => adminApi.setHidden(v.id, v.hidden), onSuccess: refresh });
  const del = useMutation({ mutationFn: (id: number) => adminApi.deleteProduct(id), onSuccess: refresh });
  const applyBulk = useMutation({
    mutationFn: (b: BulkInput) => adminApi.bulk(b),
    onSuccess: (r) => { setMessage(`Updated ${r.updated} plants.`); setPicked(new Set()); setBulk({ priceMode: "", priceValue: "", stockMode: "", stockValue: "", visibility: "" }); return refresh(); },
  });
  const importCsv = useMutation({
    mutationFn: (rows: ProductInput[]) => adminApi.importProducts(rows),
    onSuccess: (r) => { setMessage(`Import finished: ${r.created} created, ${r.updated} updated.`); return refresh(); },
  });

  const runBulk = () => {
    const b: BulkInput = { ids: [...picked] };
    if (bulk.priceMode) { b.priceMode = bulk.priceMode as BulkInput["priceMode"]; b.priceValue = Number(bulk.priceValue); }
    if (bulk.stockMode) { b.stockMode = bulk.stockMode as BulkInput["stockMode"]; b.stockValue = bulk.stockMode === "untrack" ? undefined : Number(bulk.stockValue); }
    if (bulk.visibility === "hide") b.hidden = true;
    if (bulk.visibility === "show") b.hidden = false;
    if (bulk.visibility === "feature") b.featured = true;
    if (bulk.visibility === "unfeature") b.featured = false;
    setMessage(null);
    applyBulk.mutate(b);
  };
  const bulkReady = picked.size > 0 && (bulk.visibility || (bulk.priceMode && bulk.priceValue !== "" && !Number.isNaN(Number(bulk.priceValue))) || bulk.stockMode === "untrack" || (bulk.stockMode && bulk.stockValue !== "" && !Number.isNaN(Number(bulk.stockValue))));

  const exportCsv = () => downloadText(`products-${todayKey()}.csv`, toCsv([
    CSV_HEADER,
    ...items.map((p) => [p.slug, p.nameEn, p.nameBn, p.descriptionEn, p.descriptionBn, p.category, p.price, p.stock ?? "", p.hidden, p.featured, p.image.src, p.image.width, p.image.height,
      p.care.light, p.care.water, p.care.difficulty, p.bonsai?.style ?? "", p.bonsai?.ageYears ?? "", p.bonsai?.heightCm ?? "", p.bonsai?.placement ?? ""]),
  ]));
  const downloadTemplate = () => downloadText("products-template.csv", toCsv([
    CSV_HEADER,
    ["my-new-plant", "My New Plant", "", "A short description of at least ten characters.", "", "indoor", 450, 20, "false", "false", "/images/products/spider-plant.webp", 1200, 1200, "medium", "moderate", "easy", "", "", "", ""],
  ]));

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    const rows = parseCsv(await file.text());
    const header = rows[0]?.map((h) => h.trim());
    if (!header || !header.includes("slug") || !header.includes("nameEn")) { setMessage("That file doesn't look right: the first row must be the column names (download the template to see them)."); return; }
    const col = (r: string[], name: string) => (r[header.indexOf(name)] ?? "").trim();
    const bool = (v: string) => ["true", "yes", "1"].includes(v.toLowerCase());
    const parsed: ProductInput[] = rows.slice(1).map((r) => ({
      slug: col(r, "slug"), nameEn: col(r, "nameEn"), nameBn: col(r, "nameBn"), descriptionEn: col(r, "descriptionEn"), descriptionBn: col(r, "descriptionBn"),
      category: col(r, "category").toLowerCase() as CategorySlug, price: Number(col(r, "price")),
      stock: col(r, "stock") === "" ? null : Number(col(r, "stock")), hidden: bool(col(r, "hidden")), featured: bool(col(r, "featured")), needsReview: false,
      image: { src: col(r, "imageSrc"), width: Number(col(r, "imageWidth")) || 1000, height: Number(col(r, "imageHeight")) || 1000 },
      care: { light: (col(r, "light") || "medium") as Light, water: (col(r, "water") || "moderate") as Water, difficulty: (col(r, "difficulty") || "easy") as Difficulty },
      bonsai: col(r, "bonsaiStyle") ? { style: col(r, "bonsaiStyle") as BonsaiStyle, ageYears: Number(col(r, "bonsaiAgeYears")) || 0, heightCm: Number(col(r, "bonsaiHeightCm")) || 1, placement: (col(r, "bonsaiPlacement") || "indoor") as Placement } : null,
    }));
    importCsv.mutate(parsed);
    if (fileRef.current) fileRef.current.value = "";
  };

  const importErrors = importCsv.error instanceof ApiError ? importCsv.error.fields?.rows : undefined;

  return (
    <>
      <PageHeader title="Products" subtitle={list.data ? `${num(items.length)} shown` : undefined}
        actions={<>
          <button type="button" className={btn} onClick={exportCsv} disabled={items.length === 0}><Download className="size-4" aria-hidden />Export CSV</button>
          {canWrite && <>
            <button type="button" className={btn} onClick={() => fileRef.current?.click()} disabled={importCsv.isPending}><Upload className="size-4" aria-hidden />Import CSV</button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} aria-label="CSV file to import" />
            <Link href="/admin/products/new" className={btnPrimary}><Plus className="size-4" aria-hidden />Add product</Link>
          </>}
        </>} />

      {canWrite && <p className="mb-3 text-xs text-muted-foreground">Importing: plants are matched by <code>slug</code> (new slug = new plant). Nothing is saved if any row has a problem. <button type="button" className="underline underline-offset-4" onClick={downloadTemplate}>Download a template</button>.</p>}
      {message && <p role="status" className="mb-3 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm">{message}</p>}
      {importErrors && <ul role="alert" className="mb-3 list-disc rounded-xl border border-accent/40 bg-accent/5 py-2.5 ps-8 pe-4 text-sm text-accent">{importErrors.map((e) => <li key={e}>{e}</li>)}</ul>}
      {importCsv.isError && !importErrors && <ErrorLine error={importCsv.error} />}

      <section className={card}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Search"><input className={input} placeholder="Name or slug" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} /></Field>
          <Field label="Category"><select className={input} value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option value="">All</option>{CATEGORY_SLUGS.map((c) => <option key={c} value={c}>{cap(c)}</option>)}</select></Field>
          <Field label="Stock"><select className={input} value={filters.stock} onChange={(e) => setFilters({ ...filters, stock: e.target.value })}><option value="">All</option><option value="low">Low stock</option><option value="out">Out of stock</option><option value="untracked">Not tracked</option></select></Field>
          <Field label="Visibility"><select className={input} value={filters.hidden} onChange={(e) => setFilters({ ...filters, hidden: e.target.value })}><option value="">All</option><option value="false">Visible</option><option value="true">Hidden</option></select></Field>
        </div>

        {canWrite && picked.size > 0 && (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-medium">{picked.size} selected — change them all at once:</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Price">
                <span className="flex gap-2">
                  <select className={input} value={bulk.priceMode} onChange={(e) => setBulk({ ...bulk, priceMode: e.target.value })} aria-label="Price change type"><option value="">No change</option><option value="set">Set to ৳</option><option value="add">Add ৳</option><option value="percent">Change by %</option></select>
                  <input className={`${input} w-24`} inputMode="decimal" placeholder="value" value={bulk.priceValue} onChange={(e) => setBulk({ ...bulk, priceValue: e.target.value })} disabled={!bulk.priceMode} aria-label="Price value" />
                </span>
              </Field>
              <Field label="Stock">
                <span className="flex gap-2">
                  <select className={input} value={bulk.stockMode} onChange={(e) => setBulk({ ...bulk, stockMode: e.target.value })} aria-label="Stock change type"><option value="">No change</option><option value="set">Set to</option><option value="add">Add</option><option value="untrack">Stop tracking</option></select>
                  <input className={`${input} w-24`} inputMode="numeric" placeholder="units" value={bulk.stockValue} onChange={(e) => setBulk({ ...bulk, stockValue: e.target.value })} disabled={!bulk.stockMode || bulk.stockMode === "untrack"} aria-label="Stock value" />
                </span>
              </Field>
              <Field label="Visibility / featured"><select className={input} value={bulk.visibility} onChange={(e) => setBulk({ ...bulk, visibility: e.target.value })}><option value="">No change</option><option value="hide">Hide from shop</option><option value="show">Show in shop</option><option value="feature">Mark featured</option><option value="unfeature">Remove featured</option></select></Field>
              <div className="flex items-end"><button type="button" className={btnPrimary} disabled={!bulkReady || applyBulk.isPending} onClick={runBulk}>Apply to {picked.size}</button></div>
            </div>
            <div className="mt-2"><ErrorLine error={applyBulk.error} /></div>
          </div>
        )}

        <ErrorLine error={list.error ?? hide.error ?? del.error} />
        {list.data && items.length === 0 && <p className="mt-6 text-sm text-muted-foreground">No products match.</p>}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-8 py-2 text-start">{canWrite && <input type="checkbox" aria-label="Select all" checked={allPicked} onChange={() => setPicked(allPicked ? new Set() : new Set(items.map((p) => p.id)))} />}</th>
                <th className="text-start">Plant</th><th className="text-start">Category</th><th className="text-end">Price</th><th className="text-end">Stock</th><th className="ps-4 text-start">Status</th><th />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((p) => <ProductRow key={p.id} p={p} canWrite={canWrite} checked={picked.has(p.id)} onCheck={() => toggle(p.id)}
                onHide={() => hide.mutate({ id: p.id, hidden: !p.hidden })} onDelete={() => { if (confirm(`Delete “${p.nameEn}” permanently? Past orders keep their own copy of it. To just take it off the shop, use Hide instead.`)) del.mutate(p.id); }} />)}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function ProductRow({ p, canWrite, checked, onCheck, onHide, onDelete }: Readonly<{ p: AdminProduct; canWrite: boolean; checked: boolean; onCheck: () => void; onHide: () => void; onDelete: () => void }>) {
  const out = p.stock != null && p.stock <= 0;
  return (
    <tr className={p.hidden ? "opacity-60" : undefined}>
      <td className="py-2.5">{canWrite && <input type="checkbox" aria-label={`Select ${p.nameEn}`} checked={checked} onChange={onCheck} />}</td>
      <td>
        <div className="flex items-center gap-3">
          <Image src={p.image.src} alt="" width={40} height={40} className="size-10 rounded-lg object-cover" unoptimized={p.image.src.startsWith("/api/")} />
          <div className="min-w-0"><p className="truncate font-medium">{p.nameEn}</p><p className="truncate text-xs text-muted-foreground">{p.slug}</p></div>
        </div>
      </td>
      <td className="text-muted-foreground">{cap(p.category)}</td>
      <td className="text-end tabular-nums">{money(p.price)}</td>
      <td className="text-end tabular-nums">{p.stock == null ? <span className="text-muted-foreground">—</span> : num(p.stock)}</td>
      <td className="ps-4"><span className="flex flex-wrap gap-1">{p.hidden && <Badge>Hidden</Badge>}{out && <Badge tone="bad">Out of stock</Badge>}{p.featured && <Badge tone="info">Featured</Badge>}{p.needsReview && <Badge tone="warn">Needs review</Badge>}</span></td>
      <td className="text-end">
        <span className="inline-flex gap-1.5">
          <Link href={`/admin/products/${p.id}`} className={btn}>{canWrite ? "Edit" : "View"}</Link>
          {canWrite && <button type="button" className={btn} onClick={onHide}>{p.hidden ? "Show" : "Hide"}</button>}
          {canWrite && <button type="button" className={btnDanger} onClick={onDelete}>Delete</button>}
        </span>
      </td>
    </tr>
  );
}

// ============================ Add / edit form ============================
type FormState = {
  slug: string; nameEn: string; nameBn: string; descriptionEn: string; descriptionBn: string; category: CategorySlug; price: string; track: boolean; stock: string;
  hidden: boolean; featured: boolean; needsReview: boolean; imageSrc: string; imageWidth: number; imageHeight: number;
  light: Light; water: Water; difficulty: Difficulty; style: BonsaiStyle; age: string; height: string; placement: Placement;
};

const blank: FormState = {
  slug: "", nameEn: "", nameBn: "", descriptionEn: "", descriptionBn: "", category: "indoor", price: "", track: true, stock: "10", hidden: false, featured: false, needsReview: false,
  imageSrc: "", imageWidth: 1000, imageHeight: 1000, light: "medium", water: "moderate", difficulty: "easy", style: "informalUpright", age: "5", height: "30", placement: "indoor",
};

const fromProduct = (p: AdminProduct): FormState => ({
  slug: p.slug, nameEn: p.nameEn, nameBn: p.nameBn === p.nameEn ? "" : p.nameBn, descriptionEn: p.descriptionEn, descriptionBn: p.descriptionBn === p.descriptionEn ? "" : p.descriptionBn,
  category: p.category, price: String(p.price), track: p.stock != null, stock: p.stock == null ? "10" : String(p.stock), hidden: p.hidden, featured: p.featured, needsReview: p.needsReview,
  imageSrc: p.image.src, imageWidth: p.image.width, imageHeight: p.image.height, light: p.care.light, water: p.care.water, difficulty: p.care.difficulty,
  style: p.bonsai?.style ?? "informalUpright", age: String(p.bonsai?.ageYears ?? 5), height: String(p.bonsai?.heightCm ?? 30), placement: p.bonsai?.placement ?? "indoor",
});

const toInput = (f: FormState, editing: boolean): ProductInput => ({
  slug: editing || f.slug.trim() ? f.slug.trim() : undefined,
  nameEn: f.nameEn, nameBn: f.nameBn, descriptionEn: f.descriptionEn, descriptionBn: f.descriptionBn, category: f.category, price: Number(f.price),
  stock: f.track ? Math.max(0, Math.floor(Number(f.stock) || 0)) : null, hidden: f.hidden, featured: f.featured, needsReview: f.needsReview,
  image: { src: f.imageSrc, width: f.imageWidth, height: f.imageHeight }, care: { light: f.light, water: f.water, difficulty: f.difficulty },
  bonsai: f.category === "bonsai" ? { style: f.style, ageYears: Number(f.age) || 0, heightCm: Number(f.height) || 1, placement: f.placement } : null,
});

export function ProductFormPage({ id }: Readonly<{ id?: number }>) {
  const canWrite = useCan("Admin", "Manager");
  const existing = useAdminQuery(["products", "one", id], () => adminApi.product(id!), id !== undefined);
  if (id !== undefined && existing.isPending) return <div className="h-64" aria-hidden />;
  if (id !== undefined && !existing.data) return <Notice title="Product not found"><Link href="/admin/products" className={`${btn} mt-6`}>Back to products</Link></Notice>;
  return <ProductForm key={existing.data?.id ?? "new"} initial={existing.data ? fromProduct(existing.data) : blank} id={id} canWrite={canWrite} />;
}

function ProductForm({ initial, id, canWrite }: Readonly<{ initial: FormState; id?: number; canWrite: boolean }>) {
  const router = useRouter();
  const refresh = useRefresh();
  const [f, setF] = useState<FormState>(initial);
  const [uploading, setUploading] = useState<string | null>(null);
  const editing = id !== undefined;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  const save = useMutation({
    mutationFn: () => (editing ? adminApi.updateProduct(id, toInput(f, true)) : adminApi.createProduct(toInput(f, false))),
    onSuccess: async () => { await refresh(); router.push("/admin/products"); },
  });
  const fe = (k: string) => (save.error instanceof ApiError ? save.error.fields?.[k]?.[0] : undefined);

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setUploading(null);
    try {
      const img = await prepareImage(file);
      const up = await adminApi.upload(img.data);
      setF((s) => ({ ...s, imageSrc: up.src, imageWidth: img.width, imageHeight: img.height }));
    } catch (e) {
      setUploading(e instanceof Error && e.message === "TYPE" ? "Use a JPEG, PNG or WebP photo." : errorMessage(e));
    }
  };

  const ro = !canWrite;
  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="max-w-4xl">
      <PageHeader title={editing ? "Edit product" : "Add product"} subtitle={editing ? f.slug : "Fill in the English details; Bangla is optional (English is used if you leave it empty)."}
        actions={<><Link href="/admin/products" className={btn}>← Products</Link>{canWrite && <button type="submit" className={btnPrimary} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</button>}</>} />
      <ErrorLine error={save.error && !(save.error instanceof ApiError && save.error.fields) ? save.error : null} />
      {save.error instanceof ApiError && save.error.code === "SLUG_TAKEN" && <p role="alert" className="mb-3 text-sm font-medium text-accent">{errorMessage(save.error)}</p>}

      <fieldset disabled={ro} className="space-y-5">
        <section className={card}>
          <h2 className="font-display text-xl font-semibold">Basics</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Name (English)" error={fe("nameEn")}><input className={input} value={f.nameEn} onChange={(e) => set("nameEn", e.target.value)} maxLength={150} required /></Field>
            <Field label="Name (বাংলা)" hint="Optional" error={fe("nameBn")}><input className={input} lang="bn" value={f.nameBn} onChange={(e) => set("nameBn", e.target.value)} maxLength={150} /></Field>
            <Field label="Description (English)" error={fe("descriptionEn")}><textarea className={`${input} min-h-28`} value={f.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} maxLength={1500} required /></Field>
            <Field label="Description (বাংলা)" hint="Optional" error={fe("descriptionBn")}><textarea className={`${input} min-h-28`} lang="bn" value={f.descriptionBn} onChange={(e) => set("descriptionBn", e.target.value)} maxLength={1500} /></Field>
            <Field label="Category" error={fe("category")}><select className={input} value={f.category} onChange={(e) => set("category", e.target.value as CategorySlug)}>{CATEGORY_SLUGS.map((c) => <option key={c} value={c}>{cap(c)}</option>)}</select></Field>
            <Field label="Price (৳)" error={fe("price")}><input className={input} inputMode="decimal" value={f.price} onChange={(e) => set("price", e.target.value)} required /></Field>
            <Field label="Web address (slug)" hint={editing ? "Changing this breaks old links to the plant." : "Leave empty to create it from the English name."} error={fe("slug")}><input className={input} value={f.slug} onChange={(e) => set("slug", e.target.value)} placeholder="spider-plant" /></Field>
          </div>
        </section>

        <section className={card}>
          <h2 className="font-display text-xl font-semibold">Photo</h2>
          <div className="mt-4 flex flex-wrap items-start gap-5">
            <div className="grid size-40 place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-muted text-sm text-muted-foreground">
              {f.imageSrc ? <Image src={f.imageSrc} alt="Product preview" width={160} height={160} className="size-40 object-cover" unoptimized /> : "No photo yet"}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <label className={`${btn} cursor-pointer`}>
                <Upload className="size-4" aria-hidden />Upload a photo
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => void onPhoto(e.target.files?.[0])} />
              </label>
              <p className="text-xs text-muted-foreground">JPEG, PNG or WebP. It is shrunk to 1200 px before upload.</p>
              {uploading && <p role="alert" className="text-sm font-medium text-accent">{uploading}</p>}
              <Field label="…or paste an image address" hint="Photos you uploaded appear here automatically." error={fe("image")}>
                <input className={input} value={f.imageSrc} onChange={(e) => set("imageSrc", e.target.value)} placeholder="https://… or /images/products/…" />
              </Field>
            </div>
          </div>
        </section>

        <section className={card}>
          <h2 className="font-display text-xl font-semibold">Stock & visibility</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={f.track} onChange={(e) => set("track", e.target.checked)} />Track stock for this plant</label>
              <input className={`${input} mt-2`} inputMode="numeric" value={f.stock} onChange={(e) => set("stock", e.target.value)} disabled={!f.track} aria-label="Units in stock" />
              <p className="mt-1 text-xs text-muted-foreground">{f.track ? "Orders reduce this number. At 0 the plant shows “Out of stock” and can't be bought." : "Not tracked: always available to order."}</p>
              {fe("stock") && <p role="alert" className="mt-1 text-xs font-medium text-accent">{fe("stock")}</p>}
            </div>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={f.hidden} onChange={(e) => set("hidden", e.target.checked)} />Hidden from the shop</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} />Featured on the home page</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={f.needsReview} onChange={(e) => set("needsReview", e.target.checked)} />Needs review (kept off the home page)</label>
            </div>
          </div>
        </section>

        <section className={card}>
          <h2 className="font-display text-xl font-semibold">Care</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Light"><select className={input} value={f.light} onChange={(e) => set("light", e.target.value as Light)}>{LIGHTS.map((x) => <option key={x} value={x}>{cap(x)}</option>)}</select></Field>
            <Field label="Water"><select className={input} value={f.water} onChange={(e) => set("water", e.target.value as Water)}>{WATERS.map((x) => <option key={x} value={x}>{cap(x)}</option>)}</select></Field>
            <Field label="Difficulty"><select className={input} value={f.difficulty} onChange={(e) => set("difficulty", e.target.value as Difficulty)}>{LEVELS.map((x) => <option key={x} value={x}>{cap(x)}</option>)}</select></Field>
          </div>
          {fe("care") && <p role="alert" className="mt-2 text-xs font-medium text-accent">{fe("care")}</p>}
        </section>

        {f.category === "bonsai" && (
          <section className={card}>
            <h2 className="font-display text-xl font-semibold">Bonsai details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              <Field label="Style"><select className={input} value={f.style} onChange={(e) => set("style", e.target.value as BonsaiStyle)}>{BONSAI_STYLES.map((x) => <option key={x} value={x}>{cap(x)}</option>)}</select></Field>
              <Field label="Age (years)"><input className={input} inputMode="numeric" value={f.age} onChange={(e) => set("age", e.target.value)} /></Field>
              <Field label="Height (cm)"><input className={input} inputMode="numeric" value={f.height} onChange={(e) => set("height", e.target.value)} /></Field>
              <Field label="Placement"><select className={input} value={f.placement} onChange={(e) => set("placement", e.target.value as Placement)}>{PLACEMENTS.map((x) => <option key={x} value={x}>{cap(x)}</option>)}</select></Field>
            </div>
            {fe("bonsai") && <p role="alert" className="mt-2 text-xs font-medium text-accent">{fe("bonsai")}</p>}
          </section>
        )}
      </fieldset>
      {ro && <p className="mt-4 text-sm text-muted-foreground">Your role can look but not change products.</p>}
    </form>
  );
}
