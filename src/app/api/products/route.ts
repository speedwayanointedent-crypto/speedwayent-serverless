import { type NextRequest } from "next/server";
import { collections, serializeDoc, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/server-auth";
import { productSchema } from "@/lib/schemas/product";

export const dynamic = "force-dynamic";

function transformProductForFrontend(p: any) {
  return {
    id: p._id?.toString() || p.id,
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
    categories: p.categories,
    brands: p.brands,
    models: p.models,
    years: p.years,
  };
}

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const brand_id = searchParams.get("brand_id");
    const model_id = searchParams.get("model_id");
    const year_id = searchParams.get("year_id");
    const category_id = searchParams.get("category_id");
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    const match: any = { is_deleted: { $ne: true } };
    if (brand_id) match.brand_id = brand_id;
    if (model_id) match.model_id = model_id;
    if (year_id) match.year_id = year_id;
    if (category_id) match.category_id = category_id;
    if (status) match.status = status;
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
        { $skip: (page - 1) * limit },
        { $limit: limit },
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
    const countResult = await collections.products().countDocuments(match);
    return jsonResponse({
      data: filtered,
      pagination: {
        page,
        limit,
        total: countResult,
        totalPages: Math.max(1, Math.ceil(countResult / limit)),
      },
    });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireRole(req, ["admin", "manager"]);
    const body = await req.json().catch(() => ({}));
    const payload = productSchema.parse(body);

    const result = await collections.products().insertOne({
      ...payload,
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    });
    const inserted = await collections.products().findOne({ _id: result.insertedId });

    await logAudit(
      {
        user_id: user.id,
        user_email: user.email,
        action: "create",
        resource: "product",
        resource_id: result.insertedId.toString(),
        details: { name: (inserted as any).name },
      },
      req
    );

    return jsonResponse(serializeDoc(inserted), { status: 201 });
  });
}
