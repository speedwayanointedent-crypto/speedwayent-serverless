// Quick test: try a refresh token against the OAuth client in .env.local.
// Usage: node scripts/test-refresh-token.mjs <refresh_token> [recipient]
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

const token = process.argv[2];
const recipient = process.argv[3] || "samueldagbo50@gmail.com";
if (!token) {
  console.error("Usage: node scripts/test-refresh-token.mjs <refresh_token> [recipient]");
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);
oauth2.setCredentials({ refresh_token: token });

console.log("Testing refresh token against OAuth client:", process.env.GOOGLE_CLIENT_ID);
let credentials;
try {
  const r = await oauth2.refreshAccessToken();
  credentials = r.credentials;
  console.log("✓ Refresh works!");
  console.log("  new access_token:", credentials.access_token?.slice(0, 24) + "…");
  console.log("  expires_at      :", new Date(credentials.expiry_date).toISOString());
  console.log("  scope           :", credentials.scope || "(not returned)");
} catch (err) {
  console.error("✗ Refresh FAILED:", err.message);
  if (err.response?.data) console.error("  details:", JSON.stringify(err.response.data, null, 2));
  process.exit(2);
}

// Verify the access token's audience matches the OAuth client
const info = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${credentials.access_token}`).then(r => r.json());
console.log("\nAccess-token audience check:");
console.log("  aud from tokeninfo:", info.aud);
console.log("  our client_id     :", process.env.GOOGLE_CLIENT_ID);
console.log("  match?            :", info.aud === process.env.GOOGLE_CLIENT_ID ? "✓ YES" : "✗ NO");

if (info.aud !== process.env.GOOGLE_CLIENT_ID) {
  console.error("\n✗ The token was issued for a DIFFERENT OAuth client. Try re-doing the OAuth flow.");
  process.exit(3);
}

// Send a test email using the refreshed access token
oauth2.setCredentials({ access_token: credentials.access_token });
const gmail = google.gmail({ version: "v1", auth: oauth2 });
const subject = "✓ Speedway Anointed Ent — new refresh token works!";
const body = `<div style="font-family:Arial;padding:24px"><h2 style="color:#16a34a">Refresh token verified ✓</h2><p>This email was sent using a fresh refresh token against the configured OAuth client. Sent at ${new Date().toUTCString()}.</p></div>`;
const raw = Buffer.from(
  [`From: ${process.env.GMAIL_USER}`, `To: ${recipient}`, `Subject: ${subject}`, "MIME-Version: 1.0", "Content-Type: text/html; charset=utf-8"].join("\r\n") + "\r\n\r\n" + body
).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const res = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
console.log("\n✓ Test email sent. messageId:", res.data.id);
console.log("  recipient:", recipient);

// Persist to .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
let content = fs.readFileSync(envPath, "utf8");
const re = new RegExp(`^GOOGLE_REFRESH_TOKEN=.*$`, "m");
if (re.test(content)) {
  content = content.replace(re, `GOOGLE_REFRESH_TOKEN=${token}`);
  console.log("\n✓ Updated GOOGLE_REFRESH_TOKEN in .env.local");
} else {
  content += `\nGOOGLE_REFRESH_TOKEN=${token}\n`;
  console.log("\n✓ Added GOOGLE_REFRESH_TOKEN to .env.local");
}
const re2 = new RegExp(`^GOOGLE_ACCESS_TOKEN=.*$`, "m");
if (re2.test(content)) {
  content = content.replace(re2, `GOOGLE_ACCESS_TOKEN=${credentials.access_token}`);
  console.log("✓ Updated GOOGLE_ACCESS_TOKEN in .env.local");
} else {
  content += `\nGOOGLE_ACCESS_TOKEN=${credentials.access_token}\n`;
  console.log("✓ Added GOOGLE_ACCESS_TOKEN to .env.local");
}
fs.writeFileSync(envPath, content);

console.log("\n════════════════════════════════════════════════════════════");
console.log("📋 PASTE THESE TO VERCEL ENV VARS (Settings → Environment):");
console.log("════════════════════════════════════════════════════════════");
console.log("GOOGLE_REFRESH_TOKEN =", token);
console.log("GOOGLE_ACCESS_TOKEN  =", credentials.access_token);
console.log("════════════════════════════════════════════════════════════");
