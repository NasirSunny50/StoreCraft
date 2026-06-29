import { test, expect, type Page } from "@playwright/test";

const BASE = "http://localhost:3000";

async function registerFresh(page: Page, prefix: string) {
  const email = `${prefix}_${Date.now()}@e2e.test`;
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Checkout Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("supersecret");
  await page.getByLabel("Confirm password").fill("supersecret");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(`${BASE}/`);
}

async function addSonyToCart(page: Page) {
  await page.goto("/products/sony-wh-1000xm5-headphones");
  await page.getByTestId("buy-box").getByTestId("add-to-cart").click();
  await expect(page.getByTestId("cart-feedback")).toContainText("Added to cart");
}

async function fillAddress(page: Page) {
  await page.getByTestId("addr-fullName").fill("Rahim Uddin");
  await page.getByTestId("addr-phone").fill("01711223344");
  await page.getByTestId("addr-line1").fill("House 12, Road 5, Dhanmondi");
  await page.getByTestId("addr-city").fill("Dhaka");
  await page.getByTestId("addr-save").click();
}

test.describe("Checkout access", () => {
  test("guest is redirected to login", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("COD checkout flow", () => {
  test("place an order, view it, then cancel it", async ({ page }) => {
    await registerFresh(page, "checkout");
    await addSonyToCart(page);

    // Cart → checkout
    await page.goto("/cart");
    await page.getByTestId("checkout-button").click();
    await expect(page).toHaveURL(/\/checkout/);

    // No saved address yet → add one
    await expect(page.getByTestId("checkout-no-address")).toBeVisible();
    await fillAddress(page);

    // Address saved → checkout form + summary appear
    await expect(page.getByTestId("checkout-form")).toBeVisible();
    await expect(page.getByTestId("summary-shipping")).toContainText("60");
    await expect(page.getByTestId("checkout-address")).toBeChecked();

    // Place the order
    await page.getByTestId("place-order").click();

    // Confirmation
    await expect(page).toHaveURL(/\/orders\/ORD-/);
    await expect(page.getByTestId("order-confirmation")).toBeVisible();
    await expect(page.getByTestId("order-number")).toContainText("ORD-");
    await expect(page.getByTestId("order-status")).toHaveAttribute("data-status", "PENDING");

    // Cart emptied after checkout
    await expect(page.getByTestId("cart-badge")).toHaveCount(0);

    // Appears in order history
    await page.goto("/orders");
    await expect(page.getByTestId("order-row")).toHaveCount(1);
    await page.getByTestId("order-row").click();
    await expect(page).toHaveURL(/\/orders\/ORD-/);

    // Cancel (allowed while PENDING)
    await page.getByTestId("cancel-order").click();
    await page.getByTestId("cancel-order-confirm").click();
    await expect(page.getByTestId("order-status")).toHaveAttribute("data-status", "CANCELLED");
  });

  test("checkout is blocked when the cart is empty", async ({ page }) => {
    await registerFresh(page, "emptyco");
    await page.goto("/checkout");
    await expect(page.getByTestId("checkout-empty")).toBeVisible();
  });
});

test.describe("Address management", () => {
  test("user can add and delete an address", async ({ page }) => {
    await registerFresh(page, "addr");
    await page.goto("/account/addresses");
    await expect(page.getByTestId("no-addresses")).toBeVisible();

    await fillAddress(page);
    await expect(page.getByTestId("address-item")).toHaveCount(1);

    await page.getByTestId("address-delete").click();
    await expect(page.getByTestId("no-addresses")).toBeVisible();
  });
});
