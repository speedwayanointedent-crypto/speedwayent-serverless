// Test the email-service code path end-to-end using the new access-token-first logic.
// Usage: node scripts/test-email-service.mjs <recipient>
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
const staticAccessToken = process.env.GOOGLE_ACCESS_TOKEN;

async function getAccessToken() {
  if (staticAccessToken) {
    const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${staticAccessToken}`);
    const data = await r.json();
    if (r.ok && data.expires_in && Number(data.expires_in) > 60) {
      console.log("[1] Using env GOOGLE_ACCESS_TOKEN (expires in", data.expires_in, "s, aud:", data.aud + ")");
      return staticAccessToken;
    }
    console.log("[1] Env access token expired/invalid, falling through to refresh");
  }
  if (!refreshToken) throw new Error("No refresh token");
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, "https://developers.google.com/oauthplayground");
  oauth2.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2.refreshAccessToken();
  console.log("[2] Refreshed access token");
  return credentials.access_token;
}

const accessToken = await getAccessToken();
const oauth2 = new google.auth.OAuth2(clientId);
oauth2.setCredentials({ access_token: accessToken });
const gmail = google.gmail({ version: "v1", auth: oauth2 });

const subject = "✓ Speedway Anointed Ent — OAuth test (auto-detect)";
const body = `
  <div style="font-family:Arial,sans-serif;color:#0f172a;padding:24px;background:#f8fafc">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="padding:20px 24px;background:#0f172a;color:#fff">
        <h2 style="margin:0;font-size:22px">Gmail OAuth test</h2>
      </div>
      <div style="padding:24px">
        <p>Hi Samuel,</p>
        <p>This is a test email from <strong>Speedway Anointed Ent</strong>.</p>
        <p>If you can read this, the email pipeline is fully operational.</p>
        <p style="color:#64748b;font-size:12px;margin-top:24px">
          Sent at ${new Date().toUTCString()}<br/>
          From: ${sender}<br/>
          To: ${recipient}
        </p>
      </div>
    </div>
  </div>`;

const raw = Buffer.from(
  [`From: ${sender}`, `To: ${recipient}`, `Subject: ${subject}`, "MIME-Version: 1.0", "Content-Type: text/html; charset=utf-8"].join("\r\n") + "\r\n\r\n" + body
).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const res = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
console.log("✓ SENT. messageId:", res.data.id);
