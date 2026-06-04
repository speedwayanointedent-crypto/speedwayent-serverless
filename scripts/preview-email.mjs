// Render the email layout to an HTML file so we can preview it in a browser.
// Also sends a real test email to verify the styling.
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

const { sendTestEmail } = await import("../src/lib/email-service.ts").catch(async () => {
  // Fallback: use the .mjs equivalent — actually let's just inline the email via OAuth
  return { sendTestEmail: null };
});

if (sendTestEmail) {
  await sendTestEmail(recipient);
  console.log("Sent via email-service");
} else {
  // Render to file + send manually
  const html = fs.readFileSync(path.resolve("scripts/preview-email.html"), "utf8");
  fs.writeFileSync("preview-email.html", html);
  console.log("Wrote preview-email.html — open in browser");
}
