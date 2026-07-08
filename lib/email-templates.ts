import type { OrderStatus } from "@prisma/client";

/** Pure HTML template builders for transactional emails (unit-tested). */

const ACCENT = "#e74c3c";
const NAVY = "#1b2533";

export type OrderPlacedData = {
  orderNumber: string;
  customerName: string;
  items: { name: string; quantity: number; color?: string | null; lineTotal: string }[];
  subtotal: string;
  shippingFee: string;
  discount?: string | null;
  total: string;
  addressLines: string[];
  orderUrl: string;
  /** True for a paid online order — changes the payment line (vs cash-on-delivery). */
  paid: boolean;
};

export type OrderStatusData = {
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  note?: string | null;
  orderUrl: string;
  trackingCarrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
};

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#333;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background:${NAVY};padding:16px 24px;">
            <span style="font-size:20px;font-weight:800;color:${ACCENT};">Store</span><span style="font-size:20px;font-weight:800;color:#ffffff;">Craft</span>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <h1 style="margin:0 0 16px;font-size:18px;color:#111;">${title}</h1>
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:14px 24px;border-top:1px solid #e5e7eb;font-size:12px;color:#888;">
            StoreCraft — Your trusted electronics shop · Cash on Delivery · Hotline 16793
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${ACCENT};color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:10px 24px;border-radius:999px;">${label}</a>`;
}

export function orderPlacedEmail(d: OrderPlacedData): { subject: string; html: string } {
  const rows = d.items
    .map(
      (i) => `<tr>
        <td style="padding:6px 0;font-size:14px;">${escapeHtml(i.name)}${i.color ? ` <span style="color:#888;">(${escapeHtml(i.color)})</span>` : ""} <span style="color:#888;">× ${i.quantity}</span></td>
        <td align="right" style="padding:6px 0;font-size:14px;white-space:nowrap;">${i.lineTotal}</td>
      </tr>`,
    )
    .join("");

  const totals = `
    <tr><td style="padding:4px 0;color:#666;font-size:13px;">Subtotal</td><td align="right" style="font-size:13px;">${d.subtotal}</td></tr>
    <tr><td style="padding:4px 0;color:#666;font-size:13px;">Delivery</td><td align="right" style="font-size:13px;">${d.shippingFee}</td></tr>
    ${d.discount ? `<tr><td style="padding:4px 0;color:#666;font-size:13px;">Discount</td><td align="right" style="font-size:13px;color:#15803d;">− ${d.discount}</td></tr>` : ""}
    <tr><td style="padding:8px 0 0;font-weight:bold;font-size:15px;">Total</td><td align="right" style="padding:8px 0 0;font-weight:bold;font-size:15px;color:${ACCENT};">${d.total}</td></tr>`;

  const paymentLine = d.paid
    ? "Your payment has been received — thank you!"
    : "You pay in cash when the order arrives.";

  const body = `
    <p style="margin:0 0 16px;font-size:14px;">Hi ${escapeHtml(d.customerName)}, thank you for your order! We've received it and will call you shortly to confirm. ${paymentLine}</p>
    <p style="margin:0 0 16px;font-size:14px;">Order number: <strong>${escapeHtml(d.orderNumber)}</strong></p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;padding:8px 0;">${rows}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">${totals}</table>
    <p style="margin:16px 0 4px;font-weight:bold;font-size:13px;">Delivery address</p>
    <p style="margin:0 0 20px;font-size:13px;color:#666;">${d.addressLines.map(escapeHtml).join("<br/>")}</p>
    ${button(d.orderUrl, "Track your order")}`;

  return {
    subject: `Order ${d.orderNumber} received — StoreCraft`,
    html: layout("Thanks — your order is placed!", body),
  };
}

const STATUS_COPY: Record<OrderStatus, { subject: string; title: string; message: string }> = {
  PENDING: {
    subject: "is pending",
    title: "Order update",
    message: "Your order is pending review.",
  },
  CONFIRMED: {
    subject: "is confirmed",
    title: "Your order is confirmed ✔",
    message: "We've confirmed your order and are preparing it for shipment.",
  },
  SHIPPED: {
    subject: "has shipped",
    title: "Your order is on the way 🚚",
    message: "Your order has been handed to the courier and is on its way to you.",
  },
  DELIVERED: {
    subject: "was delivered",
    title: "Your order was delivered 🎉",
    message: "Your order has been delivered. We hope you enjoy your purchase!",
  },
  CANCELLED: {
    subject: "was cancelled",
    title: "Your order was cancelled",
    message: "Your order has been cancelled. Any reserved items were released. If this wasn't expected, please contact us.",
  },
};

export function orderStatusEmail(d: OrderStatusData): { subject: string; html: string } {
  const copy = STATUS_COPY[d.status];

  // Courier tracking block — only on a shipped order that has tracking details.
  const hasTracking = d.status === "SHIPPED" && (d.trackingCarrier || d.trackingNumber || d.trackingUrl);
  const trackingBlock = hasTracking
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e5e7eb;border-radius:6px;">
        <tr><td style="padding:12px 14px;">
          <p style="margin:0 0 6px;font-weight:bold;font-size:13px;">Courier tracking</p>
          ${d.trackingCarrier ? `<p style="margin:0 0 2px;font-size:13px;color:#666;">Courier: <strong style="color:#333;">${escapeHtml(d.trackingCarrier)}</strong></p>` : ""}
          ${d.trackingNumber ? `<p style="margin:0 0 2px;font-size:13px;color:#666;">Tracking no: <strong style="color:#333;">${escapeHtml(d.trackingNumber)}</strong></p>` : ""}
        </td></tr>
      </table>`
    : "";

  // When shipped with a link, the primary button tracks the parcel directly.
  const primary =
    hasTracking && d.trackingUrl
      ? `${button(d.trackingUrl, "Track your parcel")}
         <p style="margin:12px 0 0;font-size:12px;"><a href="${d.orderUrl}" style="color:#888;">View order details</a></p>`
      : button(d.orderUrl, "View order");

  const body = `
    <p style="margin:0 0 16px;font-size:14px;">Hi ${escapeHtml(d.customerName)},</p>
    <p style="margin:0 0 16px;font-size:14px;">${copy.message}</p>
    <p style="margin:0 0 16px;font-size:14px;">Order number: <strong>${escapeHtml(d.orderNumber)}</strong></p>
    ${trackingBlock}
    ${d.note ? `<p style="margin:0 0 16px;font-size:13px;color:#666;">Note: ${escapeHtml(d.note)}</p>` : ""}
    ${primary}`;

  return {
    subject: `Order ${d.orderNumber} ${copy.subject} — StoreCraft`,
    html: layout(copy.title, body),
  };
}
