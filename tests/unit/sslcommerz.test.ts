import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHash } from "node:crypto";
import {
  buildInitBody,
  sslcommerzConfigured,
  initiateSslcommerzSession,
  validateSslcommerzPayment,
  verifySslcommerzSignature,
  type InitParams,
} from "@/lib/sslcommerz";

const VARS = ["SSLCOMMERZ_STORE_ID", "SSLCOMMERZ_STORE_PASSWORD", "SSLCOMMERZ_LIVE"] as const;
const saved: Record<string, string | undefined> = {};

const params: InitParams = {
  orderNumber: "ORD-2026-000123",
  amount: "34960.00",
  customer: { name: "Nafis", email: "n@x.test", phone: "01711223344", address: "Road 1", city: "Dhaka" },
  productName: "Sony WH-1000XM5",
  numItems: 2,
  successUrl: "https://shop.test/api/payment/sslcommerz/success",
  failUrl: "https://shop.test/api/payment/sslcommerz/fail",
  cancelUrl: "https://shop.test/api/payment/sslcommerz/cancel",
  ipnUrl: "https://shop.test/api/payment/sslcommerz/ipn",
};

beforeEach(() => {
  for (const k of VARS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});
afterEach(() => {
  for (const k of VARS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("sslcommerzConfigured", () => {
  it("needs both store id and password", () => {
    expect(sslcommerzConfigured()).toBe(false);
    process.env.SSLCOMMERZ_STORE_ID = "s";
    expect(sslcommerzConfigured()).toBe(false);
    process.env.SSLCOMMERZ_STORE_PASSWORD = "p";
    expect(sslcommerzConfigured()).toBe(true);
  });
});

describe("buildInitBody", () => {
  it("includes required fields with tran_id = orderNumber and BDT currency", () => {
    const body = buildInitBody(params, "store1", "secret1");
    expect(body.get("store_id")).toBe("store1");
    expect(body.get("store_passwd")).toBe("secret1");
    expect(body.get("tran_id")).toBe("ORD-2026-000123");
    expect(body.get("total_amount")).toBe("34960.00");
    expect(body.get("currency")).toBe("BDT");
    expect(body.get("success_url")).toBe(params.successUrl);
    expect(body.get("ipn_url")).toBe(params.ipnUrl);
    expect(body.get("cus_email")).toBe("n@x.test");
    expect(body.get("num_of_item")).toBe("2");
  });
});

describe("initiateSslcommerzSession", () => {
  beforeEach(() => {
    process.env.SSLCOMMERZ_STORE_ID = "store1";
    process.env.SSLCOMMERZ_STORE_PASSWORD = "secret1";
  });

  it("returns the gateway URL on SUCCESS", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "SUCCESS", GatewayPageURL: "https://gw.test/pay/abc" }),
      }),
    );
    const res = await initiateSslcommerzSession(params);
    expect(res).toEqual({ gatewayUrl: "https://gw.test/pay/abc" });
  });

  it("throws with the gateway reason on FAILED", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "FAILED", failedreason: "Invalid store" }),
      }),
    );
    await expect(initiateSslcommerzSession(params)).rejects.toThrow("Invalid store");
  });

  it("hits the sandbox endpoint by default", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "SUCCESS", GatewayPageURL: "u" }) });
    vi.stubGlobal("fetch", fetchSpy);
    await initiateSslcommerzSession(params);
    expect(String(fetchSpy.mock.calls[0]![0])).toContain("sandbox.sslcommerz.com");
  });
});

describe("validateSslcommerzPayment", () => {
  beforeEach(() => {
    process.env.SSLCOMMERZ_STORE_ID = "store1";
    process.env.SSLCOMMERZ_STORE_PASSWORD = "secret1";
  });

  it("is valid for VALID status and returns amount + tran_id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "VALID", amount: "34960.00", tran_id: "ORD-2026-000123" }),
      }),
    );
    const res = await validateSslcommerzPayment("valid-id");
    expect(res).toEqual({ valid: true, amount: "34960.00", tranId: "ORD-2026-000123", status: "VALID" });
  });

  it("is invalid for a non-valid status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "INVALID_TRANSACTION" }) }));
    const res = await validateSslcommerzPayment("x");
    expect(res.valid).toBe(false);
    expect(res.status).toBe("INVALID_TRANSACTION");
  });
});

describe("verifySslcommerzSignature", () => {
  const storePasswd = "secret1";

  function signed(fields: Record<string, string>): Record<string, string> {
    const verifyKey = Object.keys(fields).join(",");
    const data: Record<string, string> = { ...fields, store_passwd: createHash("md5").update(storePasswd).digest("hex") };
    const hashString = Object.keys(data).sort().map((k) => `${k}=${data[k]}`).join("&");
    const verify_sign = createHash("md5").update(hashString).digest("hex");
    return { ...fields, verify_key: verifyKey, verify_sign };
  }

  it("accepts a correctly-signed payload", () => {
    const payload = signed({ tran_id: "ORD-1", status: "VALID", amount: "100.00" });
    expect(verifySslcommerzSignature(payload, storePasswd)).toBe(true);
  });

  it("rejects a tampered payload", () => {
    const payload = signed({ tran_id: "ORD-1", status: "VALID", amount: "100.00" });
    expect(verifySslcommerzSignature({ ...payload, amount: "1.00" }, storePasswd)).toBe(false);
  });

  it("rejects when signature fields are missing", () => {
    expect(verifySslcommerzSignature({ tran_id: "ORD-1" }, storePasswd)).toBe(false);
  });
});
