import { test, expect, type Page } from "@playwright/test";

async function loginAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@storecraft.test");
  await page.getByLabel("Password").fill("Admin@12345");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

test.describe("Admin pagination", () => {
  test("every admin list page renders the pagination control", async ({ page }) => {
    await loginAdmin(page);
    for (const path of [
      "/admin/products",
      "/admin/orders",
      "/admin/customers",
      "/admin/inventory",
      "/admin/categories",
      "/admin/brands",
      "/admin/coupons",
    ]) {
      await page.goto(path);
      await expect(page.getByTestId("admin-pagination")).toBeVisible();
      await expect(page.getByTestId("per-page-select")).toHaveValue("10"); // default 10
    }
  });

  test("changing rows-per-page updates the URL", async ({ page }) => {
    await loginAdmin(page);
    await page.goto("/admin/products");
    await expect(page.getByTestId("pagination-summary")).toContainText("of 6"); // 6 seeded products
    // Only one page for 6 rows → next disabled.
    await expect(page.getByTestId("page-next")).toBeDisabled();

    await page.getByTestId("per-page-select").selectOption("25");
    await expect(page).toHaveURL(/perPage=25/);
    await expect(page).toHaveURL(/page=1/);
  });
});
