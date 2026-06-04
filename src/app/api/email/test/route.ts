import { type NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";
import { sendEmail } from "@/lib/email-service";

export const dynamic = "force-dynamic";

const testSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200).optional(),
  message: z.string().min(1).max(4000).optional(),
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, "admin");
    const body = await req.json().catch(() => ({}));
    const parsed = testSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }
    const to = parsed.data.to;
    const subject = parsed.data.subject || "Speedway Anointed Ent — Gmail OAuth test";
    const message = parsed.data.message || "If you can read this, Gmail OAuth is working correctly.";

    const html = `
      <div style="font-family:Arial,sans-serif;color:#0f172a;padding:24px;background:#f8fafc">
        <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
          <div style="padding:20px 24px;background:#0f172a;color:#fff">
            <h2 style="margin:0;font-size:22px">Gmail OAuth test</h2>
          </div>
          <div style="padding:24px">
            <p>${escape(message)}</p>
            <p style="color:#64748b;font-size:12px;margin-top:24px">
              Sent at ${new Date().toUTCString()}<br/>
              Recipient: ${escape(to)}
            </p>
          </div>
        </div>
      </div>`;

    try {
      await sendEmail({ to, subject, html });
      return jsonResponse({ ok: true, message: `Test email queued to ${to}.` });
    } catch (err) {
      throw ApiError.internal(`Email send failed: ${(err as Error).message}`);
    }
  });
}

function escape(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
