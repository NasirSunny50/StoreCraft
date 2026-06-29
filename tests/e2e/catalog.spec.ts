import { test, expect, type Page } from "@playwright/test";

const BASE = "http://localhost:3000";

async function registerFresh(page: Page, prefix: string) {
  const email = `${prefix}_${Date.now()}@e2e.test`;
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Catalog Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("supersecret");
  await page.getByLabel("Confirm password").fill("supersecret");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(`${BASE}/`);
  return email;
}

// Adds the product currently shown on a detail page to the cart, scoped to the
// buy box (related-product cards also carry an add-to-cart button) and waiting
// for the server action to confirm before the caller navigates away.
async function addMainToCart(page: Page) {
  await page.getByTestId("buy-box").getByTestId("add-to-cart").click();
  await expect(page.getByTestId("cart-feedback")).toContainText("Added to cart");
}

test.describe("Home", () => {
  test("shows banner, categories and featured products", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("home-heading")).toBeVisible();
    await expect(page.getByTestId("category-nav")).toBeVisible();
    const featured = page.getByTestId("featured-grid").getByTestId("product-card");
    expect(await featured.count()).toBeGreaterThanOrEqual(4);
  });
});

test.describe("Listing, filters, sort & search", () => {
  test("lists all products with a result count", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByTestId("listing-heading")).toBeVisible();
    await expect(page.getByTestId("result-count")).toHaveText("6 products");
    await expect(page.getByTestId("product-card")).toHaveCount(6);
  });

  test("filters by category and reflects state in the URL", async ({ page }) => {
    await page.goto("/products");
    await page.selectOption('[data-testid="filter-category"]', "audio");
    await page.getByTestId("apply-filters").click();
    await expect(page).toHaveURL(/category=audio/);
    await expect(page.getByTestId("result-count")).toHaveText("1 product");
    await expect(page.getByTestId("product-card")).toHaveAttribute(
      "data-slug",
      "sony-wh-1000xm5-headphones",
    );
  });

  test("search matches name/description", async ({ page }) => {
    await page.goto("/products");
    await page.getByTestId("filter-q").fill("iphone");
    await page.getByTestId("apply-filters").click();
    await expect(page.getByTestId("result-count")).toHaveText("1 product");
    await expect(page.getByTestId("product-card")).toHaveAttribute(
      "data-slug",
      "iphone-15-pro",
    );
  });

  test("in-stock filter hides out-of-stock products", async ({ page }) => {
    await page.goto("/products");
    await page.getByTestId("filter-in-stock").check();
    await page.getByTestId("apply-filters").click();
    await expect(page.getByTestId("result-count")).toHaveText("5 products");
  });

  test("minimum rating filter", async ({ page }) => {
    await page.goto("/products");
    await page.selectOption('[data-testid="filter-rating"]', "4");
    await page.getByTestId("apply-filters").click();
    await expect(page.getByTestId("result-count")).toHaveText("4 products");
  });

  test("price ascending sort orders cheapest first", async ({ page }) => {
    await page.goto("/products");
    await page.selectOption('[data-testid="filter-sort"]', "price-asc");
    await page.getByTestId("apply-filters").click();
    await expect(page.getByTestId("product-card").first()).toHaveAttribute(
      "data-slug",
      "anker-powercore-20000",
    );
  });

  test("clear resets filters", async ({ page }) => {
    await page.goto("/products?category=audio");
    await expect(page.getByTestId("result-count")).toHaveText("1 product");
    await page.getByTestId("clear-filters").click();
    await expect(page).toHaveURL(`${BASE}/products`);
    await expect(page.getByTestId("result-count")).toHaveText("6 products");
  });

  test("empty state when nothing matches", async ({ page }) => {
    await page.goto("/products");
    await page.getByTestId("filter-q").fill("zzz-nonexistent-zzz");
    await page.getByTestId("apply-filters").click();
    await expect(page.getByTestId("empty-state")).toBeVisible();
  });

  test("filter state in URL is shareable", async ({ page }) => {
    await page.goto("/products?category=audio");
    await expect(page.getByTestId("result-count")).toHaveText("1 product");
    await expect(page.locator('[data-testid="filter-category"]')).toHaveValue("audio");
  });
});

test.describe("Product detail", () => {
  test("renders gallery, specs, reviews and related products", async ({ page }) => {
    await page.goto("/products/macbook-air-m3-13-inch");
    await expect(page.getByTestId("product-title")).toHaveText("MacBook Air M3 13-inch");
    await expect(page.getByTestId("detail-price")).toContainText("149,900");
    await expect(page.getByTestId("spec-table")).toBeVisible();
    await expect(page.getByTestId("review-list")).toBeVisible();
    await expect(page.getByTestId("related-grid")).toBeVisible();
  });

  test("out-of-stock product disables Add to cart", async ({ page }) => {
    await page.goto("/products/samsung-galaxy-s24-ultra");
    await expect(page.getByTestId("stock-status")).toContainText("Stock Out");
    await expect(
      page.getByTestId("buy-box").getByTestId("add-to-cart"),
    ).toBeDisabled();
  });
});

test.describe("Cart (guest)", () => {
  test("add to cart updates badge and cart page", async ({ page }) => {
    await page.goto("/products/sony-wh-1000xm5-headphones");
    await addMainToCart(page);
    await expect(page.getByTestId("cart-badge")).toHaveText("1");

    await page.goto("/cart");
    await expect(page.getByTestId("cart-item")).toHaveCount(1);
    await expect(page.getByTestId("cart-subtotal")).toContainText("34,900");
  });

  test("increase quantity updates line total and subtotal", async ({ page }) => {
    await page.goto("/products/sony-wh-1000xm5-headphones");
    await addMainToCart(page);

    await page.goto("/cart");
    await page.getByTestId("qty-increase").click();
    await expect(page.getByTestId("cart-qty")).toHaveText("2");
    await expect(page.getByTestId("line-total")).toContainText("69,800");
    await expect(page.getByTestId("cart-subtotal")).toContainText("69,800");
  });

  test("quantity cannot exceed available stock", async ({ page }) => {
    // Anker power bank has stock 3.
    await page.goto("/products/anker-powercore-20000");
    await addMainToCart(page);
    await page.goto("/cart");
    await page.getByTestId("qty-increase").click(); // 2
    await page.getByTestId("qty-increase").click(); // 3
    await expect(page.getByTestId("cart-qty")).toHaveText("3");
    await expect(page.getByTestId("qty-increase")).toBeDisabled();
  });

  test("remove empties the cart", async ({ page }) => {
    await page.goto("/products/sony-wh-1000xm5-headphones");
    await addMainToCart(page);
    await page.goto("/cart");
    await page.getByTestId("cart-remove").click();
    await expect(page.getByTestId("cart-empty")).toBeVisible();
  });
});

test.describe("Wishlist", () => {
  test("guest is prompted to log in", async ({ page }) => {
    await page.goto("/products/macbook-air-m3-13-inch");
    await page.getByTestId("wishlist-button").click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("logged-in user can add and move to cart", async ({ page }) => {
    await registerFresh(page, "wish");

    await page.goto("/products/macbook-air-m3-13-inch");
    await page.getByTestId("wishlist-button").click();
    await expect(page.getByTestId("wishlist-badge")).toHaveText("1");

    await page.goto("/wishlist");
    await expect(page.getByTestId("wishlist-item")).toHaveCount(1);
    await page.getByTestId("move-to-cart").click();
    await expect(page.getByTestId("wishlist-empty")).toBeVisible();
    await expect(page.getByTestId("cart-badge")).toHaveText("1");
  });
});

test.describe("Guest cart merge on auth", () => {
  test("guest cart is preserved after registering", async ({ page }) => {
    await page.goto("/products/sony-wh-1000xm5-headphones");
    await addMainToCart(page);
    await expect(page.getByTestId("cart-badge")).toHaveText("1");

    await registerFresh(page, "merge");

    await expect(page.getByTestId("cart-badge")).toHaveText("1");
    await page.goto("/cart");
    await expect(page.getByTestId("cart-item")).toHaveCount(1);
  });
});
