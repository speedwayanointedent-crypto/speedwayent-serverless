import { google } from "googleapis";

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  GOOGLE_ACCESS_TOKEN,
  GMAIL_USER,
  OWNER_EMAIL,
  NOTIFICATION_COPY_EMAILS,
} = process.env;

const ADMIN_EMAIL = OWNER_EMAIL || GMAIL_USER;
const OAUTH_REDIRECT_URI = "https://developers.google.com/oauthplayground";

const hasRefresh = Boolean(GMAIL_USER && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN);
const hasAccess = Boolean(GMAIL_USER && GOOGLE_ACCESS_TOKEN);
const canSendEmail = () => hasRefresh || hasAccess;

let cachedToken: string | null = null;
let tokenExpiry = 0;

const getOAuth2Client = () => {
  const client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OAUTH_REDIRECT_URI);
  if (GOOGLE_REFRESH_TOKEN) client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return client;
};

const getAccessToken = async (): Promise<string> => {
  // 1) Cached
  if (cachedToken && Date.now() < tokenExpiry - 60_000) return cachedToken;

  // 2) Refresh
  if (GOOGLE_REFRESH_TOKEN && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    const oauth2Client = getOAuth2Client();
    const { credentials } = await oauth2Client.refreshAccessToken();
    if (!credentials.access_token) throw new Error("No access_token returned by refresh");
    cachedToken = credentials.access_token;
    tokenExpiry = credentials.expiry_date || Date.now() + 3_600_000;
    return cachedToken;
  }

  // 3) Static env fallback
  if (GOOGLE_ACCESS_TOKEN) {
    try {
      const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${GOOGLE_ACCESS_TOKEN}`);
      const data: any = await r.json();
      if (r.ok && data.expires_in && Number(data.expires_in) > 60) {
        cachedToken = GOOGLE_ACCESS_TOKEN;
        tokenExpiry = Date.now() + Number(data.expires_in) * 1000;
        return cachedToken;
      }
    } catch {
      // ignore
    }
  }

  throw new Error("No valid access token and no working refresh token configured");
};

const getCopyEmails = (primaryTo: string) => {
  const raw = String(NOTIFICATION_COPY_EMAILS || "");
  const list = raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  return list.filter(
    (email) => email.toLowerCase() !== String(primaryTo || "").toLowerCase()
  );
};

const BRAND = {
  name: "Speedway Anointed Ent",
  supportEmail: process.env.GMAIL_USER || "support@speedway.example",
  website: process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://speedway-anointed-ent.vercel.app",
};

function emailLayout({
  title,
  intro,
  ctaLabel,
  ctaLink,
  body,
  footer,
}: {
  title: string;
  intro?: string;
  ctaLabel?: string;
  ctaLink?: string;
  body?: string;
  footer?: string;
}) {
  const safeTitle = escapeHtml(title);
  const safeIntro = intro ? escapeHtml(intro) : "";
  const safeFooter = footer ? escapeHtml(footer) : "";
  const safeCtaLabel = ctaLabel ? escapeHtml(ctaLabel) : "";
  return `
    <div style="background:#f8fafc;padding:24px 12px;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
        <div style="padding:20px 24px;background:#0f172a;color:#ffffff;">
          <div style="font-size:14px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.7;">${escapeHtml(BRAND.name)}</div>
          <h2 style="margin:8px 0 0;font-size:22px;">${safeTitle}</h2>
        </div>
        <div style="padding:24px;">
          ${safeIntro ? `<p style="margin:0 0 12px;">${safeIntro}</p>` : ""}
          ${body || ""}
          ${
            ctaLabel && ctaLink
              ? `<a href="${ctaLink}" style="display:inline-block;margin-top:16px;padding:12px 18px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;">${safeCtaLabel}</a>`
              : ""
          }
          ${
            safeFooter
              ? `<div style="margin-top:20px;font-size:12px;color:#64748b;">${safeFooter}</div>`
              : ""
          }
        </div>
        <div style="padding:16px 24px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
          <div>Need help? <a href="mailto:${escapeHtml(BRAND.supportEmail)}" style="color:#0f172a;text-decoration:none;">${escapeHtml(BRAND.supportEmail)}</a></div>
          <div style="margin-top:6px;">
            <a href="${escapeHtml(BRAND.website)}" style="color:#0f172a;text-decoration:none;">Visit website</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(s: any) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  if (!canSendEmail() || !to) {
    console.warn("[email] cannot send - missing Gmail OAuth env vars or recipient");
    return false;
  }
  try {
    const accessToken = await getAccessToken();
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const copyEmails = getCopyEmails(to);
    const lines = [
      `From: ${BRAND.name} <${GMAIL_USER}>`,
      `To: ${to}`,
      ...(copyEmails.length ? [`Bcc: ${copyEmails.join(", ")}`] : []),
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="UTF-8"',
      "",
      html || "",
    ];

    const raw = Buffer.from(lines.join("\n"))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
    return true;
  } catch (err) {
    console.error("[email] send failed:", (err as Error)?.message);
    return false;
  }
};

export const sendWelcomeEmail = async (to: string, name: string) => {
  return sendEmail({
    to,
    subject: "Welcome to Speedway Anointed Ent",
    html: emailLayout({
      title: "Welcome onboard",
      intro: `Hi ${name || ""}, thanks for joining ${BRAND.name}.`,
      ctaLabel: "Browse parts",
      ctaLink: `${BRAND.website}/shop`,
      body: `<p style="margin:0;">Your account is ready. Explore genuine parts, check fitment, and place orders with confidence.</p>`,
      footer: "You're receiving this email because you created an account.",
    }),
  });
};

export const sendLoginAlert = async (to: string) => {
  return sendEmail({
    to,
    subject: "Login alert",
    html: emailLayout({
      title: "Login alert",
      intro: "We noticed a new sign-in to your account.",
      ctaLabel: "Reset password",
      ctaLink: `${BRAND.website}/forgot-password`,
      body: `<p style="margin:0;">If this wasn't you, reset your password immediately to secure your account.</p>`,
      footer: "If you recognize this activity, no further action is needed.",
    }),
  });
};

export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
  return sendEmail({
    to,
    subject: "Password reset",
    html: emailLayout({
      title: "Reset your password",
      intro: "We received a request to reset your password. Click the button below to continue.",
      ctaLabel: "Reset password",
      ctaLink: resetLink,
      footer: "If you didn't request this, you can ignore this email.",
    }),
  });
};

export const sendOrderConfirmation = async (
  to: string,
  orderId: string,
  total: number,
  items?: { name?: string; quantity: number; price: number }[]
) => {
  const itemRows = (items || [])
    .map(
      (it) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(
          it.name || "Item"
        )}</td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">${
          it.quantity
        }</td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">GHS ${(
          it.price * it.quantity
        ).toFixed(2)}</td></tr>`
    )
    .join("");

  const itemsTable = itemRows
    ? `<table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:14px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #cbd5e1;">Item</th>
            <th style="text-align:center;padding:6px 8px;border-bottom:2px solid #cbd5e1;">Qty</th>
            <th style="text-align:right;padding:6px 8px;border-bottom:2px solid #cbd5e1;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>`
    : "";

  return sendEmail({
    to,
    subject: `Order #${orderId} confirmation`,
    html: emailLayout({
      title: `Order #${orderId} confirmed`,
      intro: `Thank you for your order. We've received it and will process it shortly.`,
      body: `${itemsTable}<p style="margin:16px 0 0;font-size:16px;"><strong>Order total: GHS ${Number(
        total
      ).toFixed(2)}</strong></p>`,
      ctaLabel: "View order",
      ctaLink: `${BRAND.website}/orders`,
      footer: "We'll send you another email when your order ships.",
    }),
  });
};

export const sendAdminOrderNotification = async (
  orderId: string,
  total: number,
  customerEmail?: string | null
) => {
  if (!ADMIN_EMAIL) return false;
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `New order received #${orderId}`,
    html: emailLayout({
      title: "New order received",
      intro: `A new order has been placed on ${BRAND.name}.`,
      body: `
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px;">
          <tr><td style="padding:6px 0;color:#64748b;">Order ID</td><td style="padding:6px 0;text-align:right;font-weight:600;">#${escapeHtml(
            orderId
          )}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">Total</td><td style="padding:6px 0;text-align:right;font-weight:600;">GHS ${Number(
            total
          ).toFixed(2)}</td></tr>
          ${
            customerEmail
              ? `<tr><td style="padding:6px 0;color:#64748b;">Customer</td><td style="padding:6px 0;text-align:right;">${escapeHtml(
                  customerEmail
                )}</td></tr>`
              : ""
          }
        </table>
      `,
      ctaLabel: "Open admin",
      ctaLink: `${BRAND.website}/admin/orders`,
      footer: "Reply to this email thread to follow up with the customer.",
    }),
  });
};

export const sendOrderStatusEmail = async (to: string, orderId: string, status: string) => {
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
  return sendEmail({
    to,
    subject: `Order #${orderId} status updated`,
    html: emailLayout({
      title: `Order status updated`,
      intro: `Your order #${orderId} status has been updated.`,
      body: `<p style="margin:12px 0 0;font-size:16px;">New status: <strong>${escapeHtml(
        statusLabel
      )}</strong></p>`,
      ctaLabel: "View order",
      ctaLink: `${BRAND.website}/orders`,
      footer: "If you have any questions, just reply to this email.",
    }),
  });
};

export const sendReturnStatusEmail = async (to: string, orderId: string, status: string) => {
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
  return sendEmail({
    to,
    subject: `Return ${statusLabel} — Speedway Anointed Ent`,
    html: emailLayout({
      title: `Return ${statusLabel}`,
      intro: `Your return request for order #${orderId} has been updated.`,
      body: `<p style="margin:12px 0 0;font-size:16px;">Status: <strong>${escapeHtml(
        statusLabel
      )}</strong></p>`,
      ctaLabel: "Contact us",
      ctaLink: `${BRAND.website}/contact`,
      footer: "If you have any questions, just reply to this email.",
    }),
  });
};

export const sendContactAdminEmail = async (input: {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
}) => {
  if (!ADMIN_EMAIL) return false;
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: input.subject
      ? `[Contact] ${input.subject} — from ${input.name}`
      : `[Contact] New message from ${input.name}`,
    html: emailLayout({
      title: "New contact form submission",
      intro: `You have a new message from ${input.name}.`,
      body: `
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px;">
          <tr><td style="padding:6px 0;color:#64748b;width:120px;">From</td><td style="padding:6px 0;">${escapeHtml(
            input.name
          )} &lt;<a href="mailto:${escapeHtml(input.email)}" style="color:#0f172a;">${escapeHtml(
        input.email
      )}</a>&gt;</td></tr>
          ${input.phone ? `<tr><td style="padding:6px 0;color:#64748b;">Phone</td><td style="padding:6px 0;">${escapeHtml(input.phone)}</td></tr>` : ""}
          ${input.subject ? `<tr><td style="padding:6px 0;color:#64748b;">Subject</td><td style="padding:6px 0;">${escapeHtml(input.subject)}</td></tr>` : ""}
        </table>
        <p style="margin:16px 0 6px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Message</p>
        <pre style="white-space:pre-wrap;font-family:Arial,sans-serif;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0;margin:0;">${escapeHtml(
          input.message
        )}</pre>
      `,
      ctaLabel: "Reply to " + input.name,
      ctaLink: `mailto:${input.email}`,
      footer: `Reply directly to this email to contact ${input.name}.`,
    }),
  });
};

export const sendContactAutoReply = async (input: {
  to: string;
  name: string;
  message: string;
}) => {
  return sendEmail({
    to: input.to,
    subject: `We received your message — ${BRAND.name}`,
    html: emailLayout({
      title: "We got your message",
      intro: `Hi ${input.name}, thanks for reaching out to ${BRAND.name}.`,
      body: `
        <p style="margin:12px 0 6px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Your message</p>
        <blockquote style="border-left:3px solid #cbd5e1;padding:6px 12px;margin:0;color:#475569;background:#f8fafc;border-radius:6px;">${escapeHtml(
          input.message
        )}</blockquote>
      `,
      ctaLabel: "Browse parts",
      ctaLink: `${BRAND.website}/shop`,
      footer: "We typically reply within 24 hours.",
    }),
  });
};

export const sendTestEmail = async (to: string) => {
  const ok = await sendEmail({
    to,
    subject: "Speedway Anointed Ent test email",
    html: emailLayout({
      title: "Test email",
      intro: "This is a test email to confirm Gmail API is working.",
      footer: "If you received this, your email configuration is correct.",
    }),
  });
  if (!ok) throw new Error("Failed to send test email. Check server logs for details.");
  return ok;
};

export { canSendEmail, ADMIN_EMAIL, BRAND };
