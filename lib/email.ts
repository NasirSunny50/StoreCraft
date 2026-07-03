const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type EmailInput = { to: string; subject: string; html: string };
export type EmailResult = { sent: boolean; error?: string };

/** True when a Resend API key is present (i.e. email is enabled). */
export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Send a transactional email via the Resend REST API. Never throws — order
 * flows must not fail because a notification could not be delivered. When no
 * API key is configured (local dev, tests) the email is skipped and logged.
 */
export async function sendEmail(input: EmailInput): Promise<EmailResult> {
  if (!emailConfigured()) {
    console.log(`[email skipped — RESEND_API_KEY not set] to=${input.to} subject="${input.subject}"`);
    return { sent: false, error: "not-configured" };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "StoreCraft <onboarding@resend.dev>",
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email failed] Resend ${res.status}: ${body}`);
      return { sent: false, error: `Resend ${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    console.error("[email failed]", e);
    return { sent: false, error: e instanceof Error ? e.message : "send failed" };
  }
}
