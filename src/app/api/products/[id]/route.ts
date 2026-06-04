import { type NextRequest } from "next/server";
import { collections, serializeDoc, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/server-auth";
import { productUpdateSchema } from "@/lib/schemas/product";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const productId = toObjectId(id);
    const product: any[] = await collections
      .products()
      .aggregate([
        { $match: { _id: productId as any, is_deleted: { $ne: true } } },
        { $lookup: { from: "categories", localField: "category_id", foreignField: "_id", as: "category_data" } },
        { $lookup: { from: "brands", localField: "brand_id", foreignField: "_id", as: "brand_data" } },
        { $lookup: { from: "models", localField: "model_id", foreignField: "_id", as: "model_data" } },
        { $lookup: { from: "years", localField: "year_id", foreignField: "_id", as: "year_data" } },
        { $unwind: { path: "$category_data", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$brand_data", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$model_data", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$year_data", preserveNullAndEmptyArrays: true } },
      ])
      .toArray();

    if (!product || product.length === 0) throw ApiError.notFound("Product not found");
    const p = product[0];
    const { _id, category_data, brand_data, model_data, year_data, ...rest } = p;
    return jsonResponse({
      id: _id?.toString(),
      _id: undefined,
      ...rest,
      category_id: rest.category_id?.toString(),
      brand_id: rest.brand_id?.toString(),
      model_id: rest.model_id?.toString(),
      year_id: rest.year_id?.toString(),
      categories: category_data ? { name: category_data.name } : undefined,
      brands: brand_data ? { name: brand_data.name } : undefined,
      models: model_data
        ? { name: model_data.name, image_url: model_data.image_url, gallery: model_data.gallery }
        : undefined,
      years: year_data ? { id: year_data._id?.toString(), label: year_data.label } : undefined,
    });
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const user = await requireRole(req, ["admin", "manager"]);
    const body = await req.json().catch(() => ({}));
    const payload = productUpdateSchema.parse(body);

    const doc: any = await collections.products().findOneAndUpdate(
      { _id: toObjectId(id) as any },
      { $set: { ...payload, updated_at: new Date() } },
      { returnDocument: "after" }
    );
    if (!doc) throw ApiError.notFound("Product not found");

    await logAudit(
      {
        user_id: user.id,
        user_email: user.email,
        action: "update",
        resource: "product",
        resource_id: id,
        details: { name: doc.name },
      },
      req
    );

    return jsonResponse(serializeDoc(doc));
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const user = await requireRole(req, ["admin", "manager"]);
    const doc: any = await collections.products().findOneAndUpdate(
      { _id: toObjectId(id) as any },
      { $set: { is_deleted: true, updated_at: new Date() } }
    );
    if (!doc) throw ApiError.notFound("Product not found");

    await logAudit(
      { user_id: user.id, user_email: user.email, action: "delete", resource: "product", resource_id: id },
      req
    );

    return new Response(null, { status: 204 });
  });
}
