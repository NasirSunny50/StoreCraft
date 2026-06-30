import { test, expect, type Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const ADMIN = { email: "admin@storecraft.test", password: "Admin@12345" };
const STAFF = { email: "staff@storecraft.test", password: "Staff@12345" };

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  // Wait for the redirect away from /login OR a login error, so callers that
  // immediately navigate to a guarded page don't race the auth cookie.
  await Promise.race([
    page.waitForURL((u) => !u.pathname.startsWith("/login")).catch(() => {}),
    page.getByTestId("form-error").waitFor({ state: "visible" }).catch(() => {}),
  ]);
}

async function logout(page: Page) {
  await page.getByTestId("logout-button").click();
  await expect(page.getByTestId("nav-login")).toBeVisible();
}

async function registerFresh(page: Page, prefix: string) {
  const email = `${prefix}_${Date.now()}@e2e.test`;
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Buyer");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("supersecret");
  await page.getByLabel("Confirm password").fill("supersecret");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(`${BASE}/`);
  return email;
}

async function addSonyAndCheckout(page: Page) {
  await page.goto("/products/sony-wh-1000xm5-headphones");
  await page.getByTestId("buy-box").getByTestId("add-to-cart").click();
  await expect(page.getByTestId("cart-feedback")).toContainText("Added to cart");
  await page.goto("/checkout");
  await page.getByTestId("addr-fullName").fill("Buyer");
  await page.getByTestId("addr-phone").fill("01711223344");
  await page.getByTestId("addr-line1").fill("Road 1, Dhaka");
  await page.getByTestId("addr-city").fill("Dhaka");
  await page.getByTestId("addr-save").click();
  await expect(page.getByTestId("checkout-form")).toBeVisible();
}

test.describe("Admin RBAC", () => {
  test("staff is limited to orders/inventory, blocked from admin-only pages", async ({ page }) => {
    await login(page, STAFF.email, STAFF.password);
    await expect(page).toHaveURL(/\/admin/);
    // Admin-only nav hidden for staff
    await expect(page.getByTestId("adminnav-products")).toHaveCount(0);
    // Staff allowed areas
    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/admin\/orders/);
    await page.goto("/admin/inventory");
    await expect(page).toHaveURL(/\/admin\/inventory/);
    // Admin-only area forbidden
    await page.goto("/admin/products");
    await expect(page).toHaveURL(/\/forbidden/);
  });

  test("admin sees the dashboard with stats", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByTestId("stat-revenue")).toBeVisible();
    await expect(page.getByTestId("stat-orders")).toBeVisible();
    await expect(page.getByTestId("adminnav-products")).toBeVisible();
  });
});

test.describe("Admin catalog management", () => {
  test("create a product → visible in storefront", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    const name = `E2E Gadget ${Date.now()}`;
    await page.goto("/admin/products/new");
    await page.getByTestId("pf-name").fill(name);
    await page.getByTestId("pf-description").fill("A product created in an e2e test.");
    await page.getByTestId("pf-price").fill("4999");
    await page.getByTestId("pf-stock").fill("7");
    await page.getByTestId("pf-submit").click();
    await expect(page).toHaveURL(/\/admin\/products$/);

    // Appears on the storefront
    await page.goto(`/products?q=${encodeURIComponent("E2E Gadget")}`);
    await expect(page.getByTestId("product-card").filter({ hasText: name })).toBeVisible();

    // Clean up so storefront counts stay deterministic for other specs.
    // Soft-deleted products drop out of the default (non-deleted) admin list.
    await page.goto("/admin/products");
    await page.getByTestId("admin-product-row").filter({ hasText: name }).getByTestId("product-toggle-delete").click();
    await expect(page.getByTestId("admin-product-row").filter({ hasText: name })).toHaveCount(0);
  });

  test("create a category", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto("/admin/categories");
    const ts = Date.now();
    const cname = `Cat ${ts}`;
    const slug = `cat-${ts}`; // shown as text in the slug column
    await page.getByTestId("taxonomy-new-name").fill(cname);
    await page.getByTestId("taxonomy-add").click();
    await expect(page.getByTestId("taxonomy-row").filter({ hasText: slug })).toBeVisible();

    // Clean up the empty category.
    await page.getByTestId("taxonomy-row").filter({ hasText: slug }).getByTestId("taxonomy-delete").click();
    await expect(page.getByTestId("taxonomy-row").filter({ hasText: slug })).toHaveCount(0);
  });
});

test.describe("Coupons", () => {
  test("admin creates a coupon, customer applies it at checkout", async ({ page }) => {
    const code = `E2E${Date.now().toString().slice(-6)}`;
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto("/admin/coupons");
    await page.getByTestId("coupon-code").fill(code);
    await page.getByTestId("coupon-value").fill("10"); // 10% (type defaults to PERCENT)
    await page.getByTestId("coupon-create").click();
    await expect(page.getByTestId("coupon-row").filter({ hasText: code.toUpperCase() })).toBeVisible();
    await logout(page);

    await registerFresh(page, "couponbuyer");
    await addSonyAndCheckout(page);
    await page.getByTestId("coupon-input").fill(code);
    await page.getByTestId("coupon-apply").click();
    await expect(page.getByTestId("coupon-applied")).toContainText("applied");
  });
});

test.describe("Order management + customer block", () => {
  test("admin updates a placed order's status", async ({ page }) => {
    await registerFresh(page, "orderbuyer");
    await addSonyAndCheckout(page);
    await page.getByTestId("place-order").click();
    await expect(page).toHaveURL(/\/orders\/ORD-/);
    const orderNumber = (await page.getByTestId("order-number").innerText()).trim();
    await logout(page);

    await login(page, ADMIN.email, ADMIN.password);
    await page.goto("/admin/orders");
    await page.getByRole("link", { name: orderNumber }).click();
    await expect(page).toHaveURL(/\/admin\/orders\//);
    await page.getByTestId("order-status-select").selectOption("SHIPPED");
    await page.getByTestId("order-status-update").click();
    await expect(page.getByTestId("order-status").first()).toHaveAttribute("data-status", "SHIPPED");
  });

  test("blocking a customer prevents login", async ({ page }) => {
    const email = await registerFresh(page, "blockme");
    await logout(page);

    await login(page, ADMIN.email, ADMIN.password);
    await page.goto(`/admin/customers?q=${encodeURIComponent(email)}`);
    const row = page.getByTestId("customer-row").filter({ hasText: email });
    await expect(row).toBeVisible();
    await row.getByTestId("block-toggle").click();
    await expect(row.getByTestId("customer-status")).toHaveText("Blocked");
    await logout(page);

    await login(page, email, "supersecret");
    await expect(page.getByTestId("form-error")).toContainText("blocked");
  });
});
