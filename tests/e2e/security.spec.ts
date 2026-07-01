import { test, expect, type Page } from "@playwright/test";

const BASE = "http://localhost:3000";

async function registerFresh(page: Page, prefix: string) {
  const email = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e4)}@e2e.test`;
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Sec Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("supersecret");
  await page.getByLabel("Confirm password").fill("supersecret");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(`${BASE}/`);
  return email;
}

async function logout(page: Page) {
  await page.getByTestId("logout-button").click();
  await expect(page.getByTestId("nav-login")).toBeVisible();
}

async function placeAnOrder(page: Page) {
  await page.goto("/products/sony-wh-1000xm5-headphones");
  await page.getByTestId("buy-box").getByTestId("add-to-cart").click();
  await expect(page.getByTestId("cart-feedback")).toContainText("Added to cart");
  await page.goto("/checkout");
  await page.getByTestId("addr-fullName").fill("Sec Tester");
  await page.getByTestId("addr-phone").fill("01711223344");
  await page.getByTestId("addr-line1").fill("Road 1, Dhaka");
  await page.getByTestId("addr-city").fill("Dhaka");
  await page.getByTestId("addr-save").click();
  await expect(page.getByTestId("checkout-form")).toBeVisible();
  await page.getByTestId("place-order").click();
  await expect(page).toHaveURL(/\/orders\/ORD-/);
  return (await page.getByTestId("order-number").innerText()).trim();
}

test.describe("Order privacy (IDOR)", () => {
  test("a customer cannot view another customer's order", async ({ page }) => {
    await registerFresh(page, "victim");
    const victimOrder = await placeAnOrder(page);
    await logout(page);

    // A different customer tries to open the victim's order by its number.
    await registerFresh(page, "attacker");
    await page.goto(`/orders/${victimOrder}`);
    await expect(page.getByTestId("order-number")).toHaveCount(0);
    await expect(page.locator("body")).toContainText(/could not be found|404/i);

    // And it never appears in the attacker's own order history.
    await page.goto("/orders");
    await expect(page.getByTestId("orders-empty")).toBeVisible();
  });
});

test.describe("Cart cannot oversell", () => {
  test("quantity is capped at available stock (Anker: 3)", async ({ page }) => {
    await page.goto("/products/anker-powercore-20000");
    await page.getByTestId("buy-box").getByTestId("qty-input").fill("999");
    await page.getByTestId("buy-box").getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-feedback")).toBeVisible();
    await page.goto("/cart");
    await expect(page.getByTestId("cart-qty")).toHaveText("3");
    await expect(page.getByTestId("cart-subtotal")).toContainText("17,700"); // 3 × 5,900
  });
});
