import { type NextRequest } from "next/server";
import { collections } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager", "staff"]);
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q");
    const status = searchParams.get("status");
    const category_id = searchParams.get("category_id");
    const brand_id = searchParams.get("brand_id");

    const match: any = { is_deleted: { $ne: true } };
    if (status) match.status = status;
    if (category_id) match.category_id = category_id;
    if (brand_id) match.brand_id = brand_id;
    if (q) match.$or = [{ name: { $regex: q, $options: "i" } }];

    const data = await collections.products().find(match).sort({ created_at: -1 }).toArray();
    const filtered = data.map((p) => ({
      id: p._id.toString(),
      _id: undefined,
      name: p.name,
      category_id: p.category_id?.toString(),
      brand_id: p.brand_id?.toString(),
      model_id: p.model_id?.toString(),
      year_id: p.year_id?.toString(),
      price: p.price,
      cost_price: p.cost_price,
      quantity: p.quantity,
      description: p.description,
      image_url: p.image_url,
      gallery: p.gallery,
      status: p.status,
      created_at: p.created_at,
    }));
    return jsonResponse(filtered);
  });
}
