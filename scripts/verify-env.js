const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const raw = fs.readFileSync(envPath, "utf8");

const env = {};
for (const line of raw.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const m = trimmed.match(/^([A-Z_][A-Z_0-9]*)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

console.log("=== Vars loaded from .env.local ===");
console.log("  total:", Object.keys(env).length);

const required = [
  "MONGODB_URI",
  "MONGODB_DB",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REFRESH_TOKEN",
  "GMAIL_USER",
  "OWNER_EMAIL",
  "FRONTEND_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_API_URL",
];

const present = required.filter((k) => env[k] !== undefined);
const missing = required.filter((k) => env[k] === undefined);
const empty = required.filter((k) => env[k] === "");
console.log("\n=== Required vars check ===");
console.log("  present:", present.length, "/", required.length);
console.log("  explicitly empty (intentional):", empty);
if (missing.length === 0) {
  console.log("  PASS: all required vars defined");
} else {
  console.log("  FAIL: undefined vars:", missing);
  process.exit(1);
}

console.log("\n=== MongoDB URI parse ===");
const uriMatch = env.MONGODB_URI.match(/^mongodb(\+srv)?:\/\/([^:]+):[^@]+@([^/?]+)/);
if (!uriMatch) {
  console.log("  FAIL: cannot parse");
  process.exit(1);
}
console.log("  PASS: protocol=mongodb" + (uriMatch[1] || ""));
console.log("    user:", uriMatch[2]);
console.log("    host:", uriMatch[3]);
console.log("    database:", env.MONGODB_DB);

console.log("\n=== MongoDB connection test ===");
const { MongoClient } = require("mongodb");
(async () => {
  const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const admin = client.db().admin();
    const dbs = await admin.listDatabases();
    console.log("  PASS: connected to cluster");
    console.log("    databases:", dbs.databases.map((d) => d.name).join(", "));
    const targetDb = client.db(env.MONGODB_DB);
    const cols = await targetDb.listCollections().toArray();
    console.log("    collections in '" + env.MONGODB_DB + "':", cols.length);
    if (cols.length > 0) {
      console.log("      names:", cols.map((c) => c.name).join(", "));
    }
    await client.close();
    console.log("  PASS: closed cleanly");
  } catch (e) {
    console.log("  FAIL:", e.message);
    process.exit(1);
  }
})();
