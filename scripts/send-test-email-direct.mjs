// Send test email using the EXISTING access token directly (bypasses refresh).
// Useful to confirm the rest of the chain works.
// Usage: node scripts/send-test-email-direct.mjs <recipient>
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
const sender = process.env.GMAIL_USER;
const accessToken = process.env.GOOGLE_ACCESS_TOKEN;

if (!accessToken) {
  console.error("✗ No GOOGLE_ACCESS_TOKEN in .env.local");
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID);
oauth2.setCredentials({ access_token: accessToken });

const gmail = google.gmail({ version: "v1", auth: oauth2 });

const subject = "✓ Speedway Anointed Ent — Gmail OAuth test (direct access token)";
const body = `
  <div style="font-family:Arial,sans-serif;color:#0f172a;padding:24px;background:#f8fafc">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="padding:20px 24px;background:#0f172a;color:#fff">
        <h2 style="margin:0;font-size:22px">Gmail OAuth test</h2>
      </div>
      <div style="padding:24px">
        <p>This is a test email from <strong>Speedway Anointed Ent</strong>.</p>
        <p>Sent using the existing access token directly (no refresh).</p>
        <p style="color:#64748b;font-size:12px;margin-top:24px">
          Sent at ${new Date().toUTCString()}<br/>
          From: ${sender}<br/>
          To: ${recipient}
        </p>
      </div>
    </div>
  </div>`;

const headers = [
  `From: ${sender}`,
  `To: ${recipient}`,
  `Subject: ${subject}`,
  `MIME-Version: 1.0`,
  `Content-Type: text/html; charset=utf-8`,
];
const raw = Buffer.from(headers.join("\r\n") + "\r\n\r\n" + body)
  .toString("base64")
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");

console.log("Sending test email to", recipient, "…");
try {
  const res = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
  console.log("✓ Sent! messageId:", res.data.id);
  console.log("\nNOTE: This used the existing access token. It expires in <1 hour.");
  console.log("For production you still need to fix the refresh-token/client mismatch.");
} catch (err) {
  console.error("✗ Send failed:", err.message);
  if (err.response?.data) console.error("details:", JSON.stringify(err.response.data, null, 2));
  process.exit(2);
}
