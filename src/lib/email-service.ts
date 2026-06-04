import { google } from "googleapis";

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  GOOGLE_ACCESS_TOKEN,
  GMAIL_USER,
  OWNER_EMAIL,
} = process.env;

const ADMIN_EMAIL = OWNER_EMAIL || GMAIL_USER;
const OAUTH_REDIRECT_URI = "https://developers.google.com/oauthplayground";

const hasRefresh = Boolean(GMAIL_USER && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN);
const hasAccess = Boolean(GMAIL_USER && GOOGLE_ACCESS_TOKEN);
const canSendEmail = () => hasRefresh || hasAccess;

let cachedToken: string | null = null;
let tokenExpiry = 0;

const getOAuth2Client = () => {
  const client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OAUTH_REDIRECT_URI);
  if (GOOGLE_REFRESH_TOKEN) client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return client;
};

const getAccessToken = async (): Promise<string> => {
  // 1) Use cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry - 60_000) return cachedToken;

  // 2) Use env-provided access token if it appears valid
  if (GOOGLE_ACCESS_TOKEN) {
    try {
      const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${GOOGLE_ACCESS_TOKEN}`);
      const data: any = await r.json();
      if (r.ok && data.expires_in && Number(data.expires_in) > 60) {
        cachedToken = GOOGLE_ACCESS_TOKEN;
        tokenExpiry = Date.now() + Number(data.expires_in) * 1000;
        return cachedToken;
      }
    } catch {
      // ignore — fall through to refresh
    }
  }

  // 3) Refresh
  if (!GOOGLE_REFRESH_TOKEN) {
    throw new Error("No valid access token and no refresh token configured");
  }
  const oauth2Client = getOAuth2Client();
  const { credentials } = await oauth2Client.refreshAccessToken();
  if (!credentials.access_token) throw new Error("No access_token returned by refresh");
  cachedToken = credentials.access_token;
  tokenExpiry = credentials.expiry_date || Date.now() + 3_600_000;
  return cachedToken;
};

const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  if (!canSendEmail()) {
    console.warn("[email] cannot send - missing Gmail OAuth env vars");
    return;
  }
  try {
    const accessToken = await getAccessToken();
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const headers = [
      `From: ${GMAIL_USER}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
    ];
    const raw = Buffer.from(headers.join("\r\n") + "\r\n\r\n" + html)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
  } catch (err) {
    console.error("[email] send failed:", (err as Error).message);
  }
};

const baseLayout = (title: string, body: string) => `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a;background:#f8fafc;padding:24px"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0"><div style="padding:20px 24px;background:#0f172a;color:#fff"><h2 style="margin:0;font-size:22px">${title}</h2></div><div style="padding:24px">${body}</div></div></body></html>`;

export const sendWelcomeEmail = async (to: string, name: string) => {
  const html = baseLayout("Welcome to Speedway", `<p>Hi ${name},</p><p>Your account is ready. Browse our catalogue of genuine spare parts at your convenience.</p>`);
  return sendEmail({ to, subject: "Welcome to Speedway Anointed Ent", html });
};

export const sendLoginAlert = async (to: string) => {
  const html = baseLayout("New Login", `<p>Your Speedway account was just signed in. If this wasn't you, change your password immediately.</p>`);
  return sendEmail({ to, subject: "New login to your Speedway account", html });
};

export const sendPasswordResetEmail = async (to: string, link: string) => {
  const html = baseLayout("Password Reset", `<p>Click below to reset your password. Link expires in 30 minutes.</p><p><a href="${link}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Reset Password</a></p>`);
  return sendEmail({ to, subject: "Reset your Speedway password", html });
};

export { sendEmail, ADMIN_EMAIL };
