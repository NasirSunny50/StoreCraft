import nodemailer from "nodemailer";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type EmailInput = { to: string; subject: string; html: string };
export type EmailResult = { sent: boolean; error?: string };

function gmailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** True when any email transport is configured (Gmail SMTP or Resend). */
export function emailConfigured(): boolean {
  return gmailConfigured() || resendConfigured();
}

/** Gmail SMTP: the From address MUST be the authenticated account. */
function gmailFrom(): string {
  const name = process.env.EMAIL_FROM_NAME ?? "StoreCraft";
  return `${name} <${process.env.GMAIL_USER}>`;
}

async function sendViaGmail(input: EmailInput): Promise<EmailResult> {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  await transporter.sendMail({
    from: gmailFrom(),
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  return { sent: true };
}

async function sendViaResend(input: EmailInput): Promise<EmailResult> {
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
}

/**
 * Send a transactional email. Prefers Gmail SMTP (deliverable to real
 * recipients without a domain), falls back to Resend. Never throws — order
 * flows must not fail because a notification could not be delivered. When no
 * transport is configured (some dev/test setups) the email is skipped + logged.
 */
export async function sendEmail(input: EmailInput): Promise<EmailResult> {
  try {
    if (gmailConfigured()) return await sendViaGmail(input);
    if (resendConfigured()) return await sendViaResend(input);
    console.log(`[email skipped — no transport configured] to=${input.to} subject="${input.subject}"`);
    return { sent: false, error: "not-configured" };
  } catch (e) {
    console.error("[email failed]", e);
    return { sent: false, error: e instanceof Error ? e.message : "send failed" };
  }
}
