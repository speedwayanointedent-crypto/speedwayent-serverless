import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections, serializeDoc } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { sendContactAdminEmail, sendContactAutoReply } from "@/lib/email-service";

export const dynamic = "force-dynamic";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().max(40).optional().nullable(),
  subject: z.string().trim().max(120).optional().nullable(),
  message: z.string().trim().min(5, "Message must be at least 5 characters").max(4000),
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const body = await req.json().catch(() => ({}));
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return jsonResponse({ error: first?.message || "Invalid input" }, { status: 400 });
    }

    const data = parsed.data;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const settings: any = (await collections.settings().findOne({ singleton: true })) || {};
    const businessName = settings.business_name || "Speedway Anointed Ent";
    const recipient = settings.support_email || process.env.OWNER_EMAIL || process.env.GMAIL_USER;

    const insert = await collections.contactMessages().insertOne({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject || null,
      message: data.message,
      ip,
      user_agent: userAgent,
      status: "new",
      created_at: new Date(),
      updated_at: new Date(),
    });

    const inserted = await collections.contactMessages().findOne({ _id: insert.insertedId });

    if (recipient) {
      sendContactAdminEmail({
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
      }).catch((err) => console.error("[email] contact admin email failed", err));

      sendContactAutoReply({
        to: data.email,
        name: data.name,
        message: data.message,
      }).catch((err) => console.error("[email] contact auto-reply failed", err));
    }

    return jsonResponse(
      { ok: true, message: "Your message has been sent. We'll get back to you soon." },
      { status: 201 }
    );
  });
}

export async function GET(_req: NextRequest) {
  return withErrorHandling(async () => {
    const { requireRole } = await import("@/lib/server-auth");
    await requireRole(_req, ["admin", "manager"]);
    const items = await collections
      .contactMessages()
      .find({})
      .sort({ created_at: -1 })
      .limit(500)
      .toArray();
    return jsonResponse(items.map((m) => serializeDoc(m)));
  });
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
