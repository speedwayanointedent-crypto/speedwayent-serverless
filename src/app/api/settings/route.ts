import { collections, toObjectId } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandling(async () => {
    const data: any = await collections.settings().findOne({ singleton: true });
    return jsonResponse(data || {});
  });
}

export async function PUT(req: Request) {
  return withErrorHandling(async () => {
    const { requireRole } = await import("@/lib/server-auth");
    const { logAudit } = await import("@/lib/audit");
    await requireRole(req as any, "admin");
    const body = await req.json().catch(() => ({}));
    const normalize = (v: any) => (v === "" ? null : v ?? null);
    const normalized = {
      singleton: true,
      business_name: normalize(body.business_name),
      support_email: normalize(body.support_email),
      support_phone: normalize(body.support_phone),
      address: normalize(body.address),
      facebook_url: normalize(body.facebook_url),
      instagram_url: normalize(body.instagram_url),
      x_url: normalize(body.x_url),
      tiktok_url: normalize(body.tiktok_url),
      linkedin_url: normalize(body.linkedin_url),
      whatsapp_url: normalize(body.whatsapp_url),
      updated_at: new Date(),
    };
    const result: any = await collections.settings().findOneAndUpdate(
      { singleton: true },
      { $set: normalized },
      { upsert: true, returnDocument: "after" }
    );
    await logAudit({ action: "settings.update", resource: "settings" }, req as any);
    return jsonResponse(result);
  });
}
