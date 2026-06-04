// Standalone test for Gmail OAuth - run with:
// node scripts/send-test-email.mjs samueldagbo50@gmail.com
import { google } from "googleapis";
import fs from "fs";
import path from "path";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("✗ .env.local not found at", envPath);
    process.exit(1);
  }
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
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

console.log("─".repeat(60));
console.log("Speedway Anointed Ent — Gmail OAuth Test");
console.log("─".repeat(60));
console.log("GMAIL_USER          :", sender || "✗ MISSING");
console.log("GOOGLE_CLIENT_ID    :", clientId ? clientId.slice(0, 20) + "…" : "✗ MISSING");
console.log("GOOGLE_CLIENT_SECRET:", clientSecret ? "✓ set (" + clientSecret.length + " chars)" : "✗ MISSING");
console.log("GOOGLE_REFRESH_TOKEN:", refreshToken ? "✓ set (" + refreshToken.length + " chars)" : "✗ MISSING");
console.log("Recipient           :", recipient);
console.log("─".repeat(60));

if (!sender || !clientId || !clientSecret || !refreshToken) {
  console.error("\n✗ Missing required Gmail OAuth env vars. Aborting.");
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(clientId, clientSecret, "https://developers.google.com/oauthplayground");
oauth2.setCredentials({ refresh_token: refreshToken });

console.log("\n1) Refreshing access token…");
let accessToken;
try {
  const { credentials } = await oauth2.refreshAccessToken();
  accessToken = credentials.access_token;
  if (!accessToken) throw new Error("No access_token in response");
  console.log("   ✓ Got access token (" + accessToken.slice(0, 20) + "…)");
} catch (err) {
  console.error("   ✗ refreshAccessToken failed:", err.message || err);
  if (err?.response?.data) {
    console.error("   details:", JSON.stringify(err.response.data, null, 2));
  }
  console.error("\n   The refresh token is likely invalid. Re-do the OAuth Playground");
  console.error("   flow to get a fresh one. See the setup steps.");
  process.exit(2);
}

const gmail = google.gmail({ version: "v1", auth: oauth2 });

const subject = "✓ Speedway Anointed Ent — Gmail OAuth test";
const bodyHtml = `
  <div style="font-family:Arial,sans-serif;color:#0f172a;padding:24px;background:#f8fafc">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="padding:20px 24px;background:#0f172a;color:#fff">
        <h2 style="margin:0;font-size:22px">Gmail OAuth test</h2>
      </div>
      <div style="padding:24px">
        <p>This is a test email from <strong>Speedway Anointed Ent</strong>.</p>
        <p>If you can read this in your inbox, the Gmail OAuth refresh token is wired up correctly
        and Vercel/Next.js will be able to send:</p>
        <ul>
          <li>Contact form submissions</li>
          <li>Order confirmations</li>
          <li>New-order admin alerts</li>
          <li>Return status updates</li>
        </ul>
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
const raw = Buffer.from(headers.join("\r\n") + "\r\n\r\n" + bodyHtml)
  .toString("base64")
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");

console.log("\n2) Sending email via Gmail API…");
try {
  const res = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
  console.log("   ✓ Sent. message id:", res.data.id, "threadId:", res.data.threadId);
  console.log("\n✅ SUCCESS — check", recipient, "inbox (and spam folder).");
} catch (err) {
  console.error("   ✗ Send failed:", err.message || err);
  if (err?.response?.data) {
    console.error("   details:", JSON.stringify(err.response.data, null, 2));
  }
  process.exit(3);
}
