// Send a styled test email using the new email-service layout.
// This re-implements the email-service code in pure JS for direct testing.
import { google } from "googleapis";
import fs from "fs";
import path from "path";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnv();

const recipient = process.argv[2] || "samueldagbo50@gmail.com";

const oauth2 = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);
oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const { credentials } = await oauth2.refreshAccessToken();
oauth2.setCredentials({ access_token: credentials.access_token });
const gmail = google.gmail({ version: "v1", auth: oauth2 });

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const BRAND = {
  name: "Speedway Anointed Ent",
  supportEmail: process.env.GMAIL_USER,
  website: process.env.FRONTEND_URL || "https://speedway-anointed-ent.vercel.app",
};

function emailLayout({ title, intro, ctaLabel, ctaLink, body, footer }) {
  return `
    <div style="background:#f8fafc;padding:24px 12px;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
        <div style="padding:20px 24px;background:#0f172a;color:#ffffff;">
          <div style="font-size:14px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.7;">${escapeHtml(BRAND.name)}</div>
          <h2 style="margin:8px 0 0;font-size:22px;">${escapeHtml(title)}</h2>
        </div>
        <div style="padding:24px;">
          ${intro ? `<p style="margin:0 0 12px;">${escapeHtml(intro)}</p>` : ""}
          ${body || ""}
          ${
            ctaLabel && ctaLink
              ? `<a href="${ctaLink}" style="display:inline-block;margin-top:16px;padding:12px 18px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;">${escapeHtml(ctaLabel)}</a>`
              : ""
          }
          ${
            footer
              ? `<div style="margin-top:20px;font-size:12px;color:#64748b;">${escapeHtml(footer)}</div>`
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

// Order confirmation preview
const itemsTable = `
  <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:14px;">
    <thead>
      <tr>
        <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #cbd5e1;">Item</th>
        <th style="text-align:center;padding:6px 8px;border-bottom:2px solid #cbd5e1;">Qty</th>
        <th style="text-align:right;padding:6px 8px;border-bottom:2px solid #cbd5e1;">Total</th>
      </tr>
    </thead>
    <tbody>
      <tr><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">Front Brake Pad Set</td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">2</td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">GHS 480.00</td></tr>
      <tr><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">Engine Oil Filter</td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">1</td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">GHS 85.00</td></tr>
      <tr><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">Air Filter</td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">1</td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">GHS 120.00</td></tr>
    </tbody>
  </table>
`;

const orderHtml = emailLayout({
  title: "Order #68290001 confirmed",
  intro: "Thank you for your order. We've received it and will process it shortly.",
  body: `${itemsTable}<p style="margin:16px 0 0;font-size:16px;"><strong>Order total: GHS 685.00</strong></p>`,
  ctaLabel: "View order",
  ctaLink: `${BRAND.website}/orders`,
  footer: "We'll send you another email when your order ships.",
});

const subject = "✓ Styled email test — Speedway Anointed Ent";
const lines = [
  `From: ${BRAND.name} <${process.env.GMAIL_USER}>`,
  `To: ${recipient}`,
  `Subject: ${subject}`,
  "MIME-Version: 1.0",
  'Content-Type: text/html; charset="UTF-8"',
  "",
  orderHtml,
];

// Save preview HTML
fs.writeFileSync("preview-email.html", `<!doctype html><html><body>${orderHtml}</body></html>`);
console.log("Wrote preview-email.html — open it in your browser to preview the styling.");

const raw = Buffer.from(lines.join("\n"))
  .toString("base64")
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");

const res = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
console.log("✓ Sent styled test email. messageId:", res.data.id, "→", recipient);
