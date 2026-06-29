import { test, expect, type Page } from "@playwright/test";

// Seeded credentials (see prisma/seed.ts).
const ADMIN = { email: "admin@storecraft.test", password: "Admin@12345" };
const STAFF = { email: "staff@storecraft.test", password: "Staff@12345" };
const CUSTOMER = { email: "customer@storecraft.test", password: "Customer@12345" };
const BLOCKED = { email: "blocked@storecraft.test", password: "Blocked@12345" };

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe("Guest access", () => {
  test("home page shows login/register for guests", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("home-heading")).toBeVisible();
    await expect(page.getByTestId("nav-login")).toBeVisible();
    await expect(page.getByTestId("nav-register")).toBeVisible();
    await expect(page.getByTestId("user-greeting")).toHaveCount(0);
  });

  test("guest visiting /admin is redirected to /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId("login-heading")).toBeVisible();
  });
});

test.describe("Registration", () => {
  test("new customer can register and is auto-logged-in", async ({ page }) => {
    const email = `e2e_${Date.now()}@e2e.test`;
    await page.goto("/register");
    await page.getByLabel("Full name").fill("E2E User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("supersecret");
    await page.getByLabel("Confirm password").fill("supersecret");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL("http://localhost:3000/");
    await expect(page.getByTestId("user-greeting")).toBeVisible();
    await expect(page.getByTestId("user-role")).toHaveText("CUSTOMER");
  });

  test("shows field error when passwords do not match", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Full name").fill("Mismatch User");
    await page.getByLabel("Email").fill(`mismatch_${Date.now()}@e2e.test`);
    await page.getByLabel("Password", { exact: true }).fill("supersecret");
    await page.getByLabel("Confirm password").fill("different");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Passwords do not match")).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });

  test("rejects duplicate email", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Full name").fill("Dup User");
    await page.getByLabel("Email").fill(CUSTOMER.email);
    await page.getByLabel("Password", { exact: true }).fill("supersecret");
    await page.getByLabel("Confirm password").fill("supersecret");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByTestId("form-error")).toContainText("already exists");
  });
});

test.describe("Login", () => {
  test("invalid credentials show an error", async ({ page }) => {
    await login(page, CUSTOMER.email, "wrongpassword");
    await expect(page.getByTestId("form-error")).toContainText(
      "Invalid email or password",
    );
    await expect(page).toHaveURL(/\/login/);
  });

  test("blocked user cannot log in", async ({ page }) => {
    await login(page, BLOCKED.email, BLOCKED.password);
    await expect(page.getByTestId("form-error")).toContainText("blocked");
    await expect(page).toHaveURL(/\/login/);
  });

  test("customer logs in and lands on storefront without admin link", async ({
    page,
  }) => {
    await login(page, CUSTOMER.email, CUSTOMER.password);
    await expect(page).toHaveURL("http://localhost:3000/");
    await expect(page.getByTestId("user-role")).toHaveText("CUSTOMER");
    await expect(page.getByTestId("nav-admin")).toHaveCount(0);
  });

  test("admin logs in and is redirected to the admin portal", async ({
    page,
  }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByTestId("admin-heading")).toBeVisible();
    await expect(page.getByTestId("admin-user-role")).toContainText("ADMIN");
  });

  test("staff logs in and can access the admin portal", async ({ page }) => {
    await login(page, STAFF.email, STAFF.password);
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByTestId("admin-user-role")).toContainText("STAFF");
  });
});

test.describe("Role-based access control", () => {
  test("logged-in customer is forbidden from the admin portal", async ({
    page,
  }) => {
    await login(page, CUSTOMER.email, CUSTOMER.password);
    await expect(page).toHaveURL("http://localhost:3000/");

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/forbidden/);
    await expect(page.getByTestId("forbidden-heading")).toBeVisible();
  });

  test("customer can log out and returns to guest state", async ({ page }) => {
    await login(page, CUSTOMER.email, CUSTOMER.password);
    await expect(page.getByTestId("user-greeting")).toBeVisible();

    await page.getByTestId("logout-button").click();
    await expect(page.getByTestId("nav-login")).toBeVisible();
    await expect(page.getByTestId("user-greeting")).toHaveCount(0);
  });
});
