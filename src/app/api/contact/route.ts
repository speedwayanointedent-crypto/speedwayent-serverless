import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections, serializeDoc } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { sendEmail } from "@/lib/email-service";

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
      const subjectLine = data.subject
        ? `[Contact] ${data.subject} — from ${data.name}`
        : `[Contact] New message from ${data.name}`;
      const html = `
        <h2>New contact form submission</h2>
        <p><strong>From:</strong> ${escapeHtml(data.name)} &lt;${escapeHtml(data.email)}&gt;</p>
        ${data.phone ? `<p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>` : ""}
        ${data.subject ? `<p><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>` : ""}
        <p><strong>Message:</strong></p>
        <pre style="white-space:pre-wrap;font-family:inherit;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0">${escapeHtml(data.message)}</pre>
        <hr/>
        <p style="color:#64748b;font-size:12px">Sent to ${escapeHtml(businessName)} • ${new Date().toUTCString()} • IP ${escapeHtml(ip)}</p>
      `;
      sendEmail({ to: recipient, subject: subjectLine, html }).catch((err) =>
        console.error("[email] contact admin email failed", err)
      );

      sendEmail({
        to: data.email,
        subject: `We received your message — ${businessName}`,
        html: `<p>Hi ${escapeHtml(data.name)},</p><p>Thanks for reaching out to ${escapeHtml(businessName)}. We typically reply within 24 hours.</p><p>Your message:</p><blockquote style="border-left:3px solid #cbd5e1;padding-left:12px;color:#475569">${escapeHtml(data.message)}</blockquote>`,
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
