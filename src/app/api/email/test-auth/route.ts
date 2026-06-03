import { type NextRequest } from "next/server";
import { z } from "zod";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";
import { sendEmail } from "@/lib/email-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, "admin");
    const body = await req.json().catch(() => ({}));
    const to = z.string().email().parse(body.to);
    await sendEmail({
      to,
      subject: "Speedway Test Email",
      html: "<p>This is a test email from Speedway Anointed Ent.</p>",
    });
    return jsonResponse({ message: "Test email queued." });
  });
}
