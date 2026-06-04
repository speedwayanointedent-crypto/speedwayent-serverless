import { z } from "zod";
import { collections } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  business_name: z.string().nullable().optional(),
  support_email: z.string().email().nullable().optional().or(z.literal("")),
  support_phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  facebook_url: z.string().url().nullable().optional().or(z.literal("")),
  instagram_url: z.string().url().nullable().optional().or(z.literal("")),
  x_url: z.string().url().nullable().optional().or(z.literal("")),
  tiktok_url: z.string().url().nullable().optional().or(z.literal("")),
  linkedin_url: z.string().url().nullable().optional().or(z.literal("")),
  whatsapp_url: z.string().url().nullable().optional().or(z.literal("")),
  business_hours: z
    .object({
      mon_fri: z.string().nullable().optional(),
      saturday: z.string().nullable().optional(),
      sunday: z.string().nullable().optional(),
    })
    .partial()
    .nullable()
    .optional(),
  map_embed_url: z.string().url().nullable().optional().or(z.literal("")),
  hero_subtitle: z.string().nullable().optional(),
  response_promise: z.string().nullable().optional(),
});

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
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: "Invalid settings", details: parsed.error.flatten() }, { status: 400 });
    }
    const normalize = (v: any) => (v === "" ? null : v ?? null);
    const normalized: any = {
      singleton: true,
      business_name: normalize(parsed.data.business_name),
      support_email: normalize(parsed.data.support_email),
      support_phone: normalize(parsed.data.support_phone),
      address: normalize(parsed.data.address),
      city: normalize(parsed.data.city),
      facebook_url: normalize(parsed.data.facebook_url),
      instagram_url: normalize(parsed.data.instagram_url),
      x_url: normalize(parsed.data.x_url),
      tiktok_url: normalize(parsed.data.tiktok_url),
      linkedin_url: normalize(parsed.data.linkedin_url),
      whatsapp_url: normalize(parsed.data.whatsapp_url),
      map_embed_url: normalize(parsed.data.map_embed_url),
      hero_subtitle: normalize(parsed.data.hero_subtitle),
      response_promise: normalize(parsed.data.response_promise),
      business_hours: parsed.data.business_hours
        ? {
            mon_fri: normalize(parsed.data.business_hours.mon_fri),
            saturday: normalize(parsed.data.business_hours.saturday),
            sunday: normalize(parsed.data.business_hours.sunday),
          }
        : null,
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
