// Exchange OAuth 'code' for refresh + access tokens using the OAuth client in .env.local.
// Usage: node scripts/exchange-code.mjs <code>
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

const code = process.argv[2];
if (!code) {
  console.error("Usage: node scripts/exchange-code.mjs <code>");
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

console.log("Exchanging code for tokens…");
console.log("  client_id    :", process.env.GOOGLE_CLIENT_ID);
console.log("  redirect_uri :", "https://developers.google.com/oauthplayground");
console.log("  code         :", code.slice(0, 20) + "…");

let tokens;
try {
  const r = await oauth2.getToken({ code, redirect_uri: "https://developers.google.com/oauthplayground" });
  tokens = r.tokens;
} catch (err) {
  console.error("✗ Exchange failed:", err.message);
  if (err.response?.data) console.error("  details:", JSON.stringify(err.response.data, null, 2));
  process.exit(2);
}

console.log("\n✓ Got tokens!");
console.log("  access_token  :", tokens.access_token?.slice(0, 20) + "…");
console.log("  refresh_token :", tokens.refresh_token ? tokens.refresh_token.slice(0, 20) + "…" : "(NONE — already have one for this user; revoke at https://myaccount.google.com/permissions first)");
console.log("  scope         :", tokens.scope);
console.log("  expires_at    :", tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : "n/a");
console.log("  token_type    :", tokens.token_type);

if (!tokens.refresh_token) {
  console.log("\n⚠ No refresh_token in the response. This usually means the user already granted");
  console.log("  permission before and Google's 'consent' prompt was skipped. To force a fresh");
  console.log("  refresh token, revoke access at https://myaccount.google.com/permissions and try again.");
  process.exit(3);
}

// Verify the new refresh token works for THIS client
console.log("\nVerifying new refresh token…");
oauth2.setCredentials({ refresh_token: tokens.refresh_token });
try {
  const r = await oauth2.refreshAccessToken();
  console.log("✓ Refresh works! new access_token:", r.credentials.access_token?.slice(0, 20) + "…");
} catch (err) {
  console.error("✗ New refresh token does NOT work:", err.message);
  if (err.response?.data) console.error("  details:", JSON.stringify(err.response.data, null, 2));
  process.exit(4);
}

// Write to .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
let content = fs.readFileSync(envPath, "utf8");
const set = (key, value) => {
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) {
    content = content.replace(re, `${key}=${value}`);
    console.log(`  updated ${key}`);
  } else {
    content += `\n${key}=${value}\n`;
    console.log(`  added ${key}`);
  }
};
set("GOOGLE_REFRESH_TOKEN", tokens.refresh_token);
set("GOOGLE_ACCESS_TOKEN", tokens.access_token || "");
fs.writeFileSync(envPath, content);
console.log("\n✓ .env.local updated");

console.log("\n════════════════════════════════════════════════════════════");
console.log("📋 COPY THESE TO VERCEL ENV VARS:");
console.log("════════════════════════════════════════════════════════════");
console.log("GOOGLE_REFRESH_TOKEN =", tokens.refresh_token);
console.log("GOOGLE_ACCESS_TOKEN  =", tokens.access_token || "");
console.log("════════════════════════════════════════════════════════════");
