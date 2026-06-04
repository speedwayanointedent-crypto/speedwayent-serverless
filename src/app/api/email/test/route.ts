import { type NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";
import { sendTestEmail } from "@/lib/email-service";

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

    try {
      await sendTestEmail(to);
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
