// Force-refresh test: clear cache, run refresh, send email.
// Usage: node scripts/test-refresh.mjs <recipient>
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
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

console.log("─".repeat(60));
console.log("Force-refresh test (no cache, no static access token)");
console.log("─".repeat(60));
console.log("Client ID    :", clientId);
console.log("Refresh token:", refreshToken?.slice(0, 20) + "…");
console.log("Recipient    :", recipient);
console.log("─".repeat(60));

const oauth2 = new google.auth.OAuth2(clientId, clientSecret, "https://developers.google.com/oauthplayground");
oauth2.setCredentials({ refresh_token: refreshToken });

console.log("\nCalling refreshAccessToken()…");
let credentials;
try {
  const r = await oauth2.refreshAccessToken();
  credentials = r.credentials;
  console.log("✓ Refreshed.");
  console.log("  access_token :", credentials.access_token?.slice(0, 20) + "…");
  console.log("  expires_at   :", credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : "n/a");
  console.log("  scope        :", credentials.scope || "(not returned)");
} catch (err) {
  console.log("✗ Refresh FAILED");
  console.log("  message:", err.message);
  if (err.response?.data) console.log("  data   :", JSON.stringify(err.response.data, null, 2));
  if (err.response?.headers?.["www-authenticate"]) {
    console.log("  www-auth:", err.response.headers["www-authenticate"]);
  }
  process.exit(2);
}

oauth2.setCredentials({ access_token: credentials.access_token });
const gmail = google.gmail({ version: "v1", auth: oauth2 });

const subject = "✓ Speedway Anointed Ent — refresh-token test";
const body = `<div style="font-family:Arial;padding:24px"><h2>Refresh-token test</h2><p>Email sent via refreshed access token (not the env one). Sent at ${new Date().toUTCString()}.</p></div>`;

const raw = Buffer.from(
  [`From: ${sender}`, `To: ${recipient}`, `Subject: ${subject}`, "MIME-Version: 1.0", "Content-Type: text/html; charset=utf-8"].join("\r\n") + "\r\n\r\n" + body
).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const res = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
console.log("\n✓ SENT. messageId:", res.data.id);
