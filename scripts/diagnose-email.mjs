// Deep diagnostic for Gmail OAuth
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

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
const accessToken = process.env.GOOGLE_ACCESS_TOKEN;

console.log("\n=== DIAGNOSTIC 1: Validate OAuth client credentials with Google's tokeninfo endpoint ===\n");
console.log("This is a public endpoint — it tells us if Google even recognizes the access token / client.\n");

// 1. Check if the existing access token is still valid
if (accessToken) {
  try {
    const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);
    const data = await r.json();
    if (r.ok) {
      console.log("✓ EXISTING GOOGLE_ACCESS_TOKEN is VALID");
      console.log("  scope    :", data.scope);
      console.log("  expires  :", data.expires_in, "seconds");
      console.log("  audience :", data.aud);
      console.log("  issued_to:", data.issued_to);
    } else {
      console.log("✗ EXISTING GOOGLE_ACCESS_TOKEN is INVALID/EXPIRED");
      console.log("  reason   :", data.error, "—", data.error_description);
    }
  } catch (e) {
    console.log("✗ tokeninfo request failed:", e.message);
  }
} else {
  console.log("(no GOOGLE_ACCESS_TOKEN in env)");
}

console.log("\n=== DIAGNOSTIC 2: Try refresh with WWW-Authenticate header detail ===\n");
const oauth2 = new google.auth.OAuth2(clientId, clientSecret, "https://developers.google.com/oauthplayground");
oauth2.setCredentials({ refresh_token: refreshToken });
try {
  const { credentials } = await oauth2.refreshAccessToken();
  console.log("✓ Refresh succeeded — token:", credentials.access_token?.slice(0, 20) + "…");
} catch (err) {
  console.log("✗ Refresh FAILED");
  console.log("  error           :", err.message);
  console.log("  error code      :", err.code);
  if (err.response?.data) {
    console.log("  response.data   :", JSON.stringify(err.response.data, null, 2));
  }
  if (err.response?.headers) {
    const wa = err.response.headers["www-authenticate"];
    if (wa) console.log("  www-authenticate:", wa);
  }
  if (err.response?.status) {
    console.log("  http status     :", err.response.status);
  }
}

console.log("\n=== DIAGNOSTIC 3: Generate a brand-new refresh token via the same OAuth client ===\n");
console.log("Step A: Visit this URL in a browser, sign in as speedwayanointedent@gmail.com,\ngrant permission, then paste the resulting 'code' URL below.\n");

const authUrl = oauth2.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://mail.google.com/"],
  redirect_uri: "https://developers.google.com/oauthplayground",
});
console.log("URL:\n" + authUrl + "\n");

// Try reading code from argv
const code = process.argv[2];
if (code) {
  try {
    const { tokens } = await oauth2.getToken({ code, redirect_uri: "https://developers.google.com/oauthplayground" });
    console.log("\n✓ Got new tokens!");
    console.log("  access_token  :", tokens.access_token?.slice(0, 20) + "…");
    console.log("  refresh_token :", tokens.refresh_token || "(none — already have one for this user, revoke first)");
    console.log("  scope         :", tokens.scope);
    console.log("  expires_in    :", tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : "n/a");
    if (tokens.refresh_token) {
      console.log("\n=== NEW REFRESH TOKEN ===");
      console.log(tokens.refresh_token);
      console.log("=========================");
      console.log("\nReplace GOOGLE_REFRESH_TOKEN in .env.local with the value above.");
    }
  } catch (err) {
    console.log("✗ Token exchange failed:", err.message);
    if (err.response?.data) console.log("  details:", JSON.stringify(err.response.data, null, 2));
  }
} else {
  console.log("(No auth code provided. Re-run with: node scripts/diagnose-email.mjs <code>)");
}
