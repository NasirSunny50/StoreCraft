import { createHash } from "node:crypto";

/**
 * SSLCommerz payment gateway client (sandbox by default). Two live endpoints:
 * a session-init API (returns the hosted GatewayPageURL) and a validation API
 * (server-side confirmation of a payment — never trust the browser callback).
 */

const SANDBOX = {
  session: "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
  validation: "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php",
};
const LIVE = {
  session: "https://securepay.sslcommerz.com/gwprocess/v4/api.php",
  validation: "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php",
};

function endpoints() {
  return process.env.SSLCOMMERZ_LIVE === "true" ? LIVE : SANDBOX;
}

/**
 * Read the store credentials, trimming surrounding whitespace. A stray
 * leading/trailing space (easy to introduce when pasting into a hosting
 * dashboard) is silently tolerated by the session-init endpoint but rejected
 * by the validation endpoint (returns INVALID_TRANSACTION) — which would let a
 * paid order come back as "failed". Trimming here makes the creds robust to it.
 */
export function sslcommerzStoreId(): string {
  return (process.env.SSLCOMMERZ_STORE_ID ?? "").trim();
}
export function sslcommerzStorePassword(): string {
  return (process.env.SSLCOMMERZ_STORE_PASSWORD ?? "").trim();
}

export function sslcommerzConfigured(): boolean {
  return Boolean(sslcommerzStoreId() && sslcommerzStorePassword());
}

export class SslcommerzError extends Error {}

export type InitParams = {
  orderNumber: string;
  amount: string; // decimal string, e.g. "34960.00"
  customer: { name: string; email: string; phone: string; address: string; city: string };
  productName: string;
  numItems: number;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
};

/** Pure builder for the session-init form body (unit-tested). */
export function buildInitBody(
  p: InitParams,
  storeId: string,
  storePasswd: string,
): URLSearchParams {
  return new URLSearchParams({
    store_id: storeId,
    store_passwd: storePasswd,
    total_amount: p.amount,
    currency: "BDT",
    tran_id: p.orderNumber,
    success_url: p.successUrl,
    fail_url: p.failUrl,
    cancel_url: p.cancelUrl,
    ipn_url: p.ipnUrl,
    shipping_method: "NO",
    product_name: p.productName,
    product_category: "Electronics",
    product_profile: "general",
    cus_name: p.customer.name,
    cus_email: p.customer.email,
    cus_add1: p.customer.address,
    cus_city: p.customer.city,
    cus_country: "Bangladesh",
    cus_phone: p.customer.phone,
    num_of_item: String(p.numItems),
  });
}

/** Start a payment session; returns the hosted gateway URL to redirect to. */
export async function initiateSslcommerzSession(p: InitParams): Promise<{ gatewayUrl: string }> {
  const storeId = sslcommerzStoreId();
  const storePasswd = sslcommerzStorePassword();
  if (!storeId || !storePasswd) throw new SslcommerzError("Payment gateway is not configured.");

  const res = await fetch(endpoints().session, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: buildInitBody(p, storeId, storePasswd),
  });
  if (!res.ok) throw new SslcommerzError(`Gateway HTTP ${res.status}`);

  const data = (await res.json()) as { status?: string; failedreason?: string; GatewayPageURL?: string };
  if (data.status !== "SUCCESS" || !data.GatewayPageURL) {
    throw new SslcommerzError(data.failedreason || "Could not start the payment session.");
  }
  return { gatewayUrl: data.GatewayPageURL };
}

export type ValidationResult = {
  valid: boolean;
  amount: string | null;
  tranId: string | null;
  status: string;
};

/** Authoritative server-side check of a completed payment via its val_id. */
export async function validateSslcommerzPayment(valId: string): Promise<ValidationResult> {
  const storeId = sslcommerzStoreId();
  const storePasswd = sslcommerzStorePassword();
  if (!storeId || !storePasswd) return { valid: false, amount: null, tranId: null, status: "NOT_CONFIGURED" };

  const url = new URL(endpoints().validation);
  url.searchParams.set("val_id", valId);
  url.searchParams.set("store_id", storeId);
  url.searchParams.set("store_passwd", storePasswd);
  url.searchParams.set("format", "json");

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) return { valid: false, amount: null, tranId: null, status: `HTTP_${res.status}` };

  const data = (await res.json()) as { status?: string; amount?: string | number; tran_id?: string };
  const status = String(data.status ?? "UNKNOWN");
  return {
    valid: status === "VALID" || status === "VALIDATED",
    amount: data.amount != null ? String(data.amount) : null,
    tranId: data.tran_id != null ? String(data.tran_id) : null,
    status,
  };
}

export type TransactionStatus = {
  /** SSLCommerz has at least one transaction record for this order number. */
  found: boolean;
  /** A successful (VALID/VALIDATED) payment exists for this order number. */
  paid: boolean;
  amount: string | null;
};

/**
 * Authoritative lookup of an order's payment state by our tran_id (order
 * number), via the merchant transaction query API. Used by the fail/cancel
 * callbacks to avoid cancelling an order that was in fact paid (never trust the
 * browser's fail/cancel POST — re-check server-side, same as success).
 */
export async function sslcommerzTransactionStatus(tranId: string): Promise<TransactionStatus> {
  const storeId = sslcommerzStoreId();
  const storePasswd = sslcommerzStorePassword();
  if (!storeId || !storePasswd || !tranId) return { found: false, paid: false, amount: null };

  const host = process.env.SSLCOMMERZ_LIVE === "true" ? "securepay" : "sandbox";
  const url = new URL(
    `https://${host}.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php`,
  );
  url.searchParams.set("tran_id", tranId);
  url.searchParams.set("store_id", storeId);
  url.searchParams.set("store_passwd", storePasswd);
  url.searchParams.set("format", "json");

  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return { found: false, paid: false, amount: null };
    const data = (await res.json()) as {
      no_of_trans_found?: number;
      element?: Array<{ status?: string; amount?: string | number }>;
    };
    const elements = data.element ?? [];
    const validEl = elements.find((e) => e.status === "VALID" || e.status === "VALIDATED");
    return {
      found: (data.no_of_trans_found ?? elements.length) > 0,
      paid: Boolean(validEl),
      amount: validEl?.amount != null ? String(validEl.amount) : null,
    };
  } catch {
    return { found: false, paid: false, amount: null };
  }
}

/**
 * Verify the IPN/callback hash so a forged POST can't drive an order state
 * change. Algorithm per SSLCommerz docs: collect the fields named in
 * verify_key, add md5(store_passwd), sort by key, join as k=v&…, md5 it, and
 * compare to verify_sign.
 */
export function verifySslcommerzSignature(
  fields: Record<string, string>,
  storePasswd: string,
): boolean {
  const verifySign = fields.verify_sign;
  const verifyKey = fields.verify_key;
  if (!verifySign || !verifyKey) return false;

  const data: Record<string, string> = {};
  for (const key of verifyKey.split(",")) {
    data[key] = fields[key] ?? "";
  }
  data.store_passwd = createHash("md5").update(storePasswd).digest("hex");

  const hashString = Object.keys(data)
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join("&");

  const computed = createHash("md5").update(hashString).digest("hex");
  return computed === verifySign;
}
