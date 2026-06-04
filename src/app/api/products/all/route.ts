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

    const data = await collections
      .products()
      .aggregate([
        { $match: match },
        {
          $lookup: {
            from: "categories",
            localField: "category_id",
            foreignField: "_id",
            as: "category_data",
          },
        },
        { $unwind: { path: "$category_data", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "brands",
            localField: "brand_id",
            foreignField: "_id",
            as: "brand_data",
          },
        },
        { $unwind: { path: "$brand_data", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "models",
            localField: "model_id",
            foreignField: "_id",
            as: "model_data",
          },
        },
        { $unwind: { path: "$model_data", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "years",
            localField: "year_id",
            foreignField: "_id",
            as: "year_data",
          },
        },
        { $unwind: { path: "$year_data", preserveNullAndEmptyArrays: true } },
        { $sort: { created_at: -1 } },
        {
          $project: {
            _id: 1,
            name: 1,
            price: 1,
            cost_price: 1,
            quantity: 1,
            description: 1,
            image_url: 1,
            gallery: 1,
            status: 1,
            created_at: 1,
            category_id: 1,
            brand_id: 1,
            model_id: 1,
            year_id: 1,
            category_data: { _id: 1, name: 1 },
            brand_data: { _id: 1, name: 1, logo_url: 1 },
            model_data: { _id: 1, name: 1, image_url: 1, gallery: 1 },
            year_data: { _id: 1, label: 1 },
          },
        },
      ])
      .toArray();

    const filtered = data.map((p: any) => ({
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
      categories: p.category_data ? { name: p.category_data.name } : undefined,
      brands: p.brand_data ? { name: p.brand_data.name } : undefined,
      models: p.model_data
        ? { name: p.model_data.name, image_url: p.model_data.image_url, gallery: p.model_data.gallery }
        : undefined,
      years: p.year_data ? { id: p.year_data._id?.toString(), label: p.year_data.label } : undefined,
    }));
    return jsonResponse(filtered);
  });
}
