// Generates README screenshots. Run with the dev (or production) server up:
//   yarn dev            # in one terminal
//   yarn screenshots    # in another  (BASE_URL=https://... to shoot a deployed site)
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "docs/screenshots";

const shots = [
  { name: "home", path: "/" },
  { name: "shop", path: "/shop" },
  { name: "product", path: "/shop/chinese-money-plant" },
  { name: "finder", path: "/finder" },
  { name: "learn", path: "/learn" },
  { name: "home-bn", path: "/bn" },
  { name: "home-dark", path: "/", dark: true },
  { name: "palette", path: "/shop", palette: true },
];

const browser = await chromium.launch();
for (const s of shots) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: s.dark ? "dark" : "light" });
  const page = await ctx.newPage();
  if (s.dark) await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.goto(BASE + s.path, { waitUntil: "networkidle" });
  if (s.palette) {
    await page.keyboard.press("Control+K");
    await page.keyboard.type("orchid");
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(1200); // let entrance animations settle
  await page.screenshot({ path: `${OUT}/${s.name}.png` });
  await ctx.close();
  console.log("saved", s.name);
}

// Mobile
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const mp = await mobile.newPage();
await mp.goto(BASE + "/", { waitUntil: "networkidle" });
await mp.waitForTimeout(1200);
await mp.screenshot({ path: `${OUT}/home-mobile.png` });
await browser.close();
console.log("saved home-mobile");
