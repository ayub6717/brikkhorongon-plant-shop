import { expect, test } from "@playwright/test";

test.describe("defaults", () => {
  test("opens in English with the light theme", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("ignores a browser that prefers Bangla and dark", async ({ browser }) => {
    const context = await browser.newContext({ locale: "bn-BD", colorScheme: "dark" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await context.close();
  });

  test("serves Bangla under /bn", async ({ page }) => {
    await page.goto("/bn");
    await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  });
});

test.describe("navigation", () => {
  test("marks the current section in the menu", async ({ page, isMobile }) => {
    await page.goto("/bonsai");
    if (isMobile) await page.getByRole("button", { name: "Menu" }).click();
    const current = page.getByRole("navigation", { name: "Primary" }).locator("a[aria-current='page']");
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText("Bonsai");
  });

  test("keeps the section active on a nested page", async ({ page, isMobile }) => {
    await page.goto("/shop/spider-plant");
    if (isMobile) await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("navigation", { name: "Primary" }).locator("a[aria-current='page']")).toHaveText("Shop");
  });

  test("offers a skip link", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  });
});

test.describe("shopping", () => {
  test("adds a plant to the cart", async ({ page }) => {
    await page.goto("/shop/spider-plant");
    await page.getByRole("button", { name: "Add to cart" }).click();
    await page.goto("/cart");
    await expect(page.getByText("Spider Plant")).toBeVisible();
  });

  test("the plant finder returns matches", async ({ page }) => {
    await page.goto("/finder");
    for (let i = 0; i < 5; i++) await page.getByRole("radio").first().click();
    await expect(page.getByRole("heading", { name: "Your plant matches" })).toBeVisible();
    await expect(page.getByRole("article")).not.toHaveCount(0);
  });
});

test("unknown pages show our own 404", async ({ page }) => {
  const res = await page.goto("/definitely-not-a-page");
  expect(res?.status()).toBe(404);
});
