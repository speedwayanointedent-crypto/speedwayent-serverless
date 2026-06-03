import { type NextRequest } from "next/server";
import { collections, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;

    const products: any[] = await collections
      .products()
      .aggregate([
        { $match: { category_id: id, status: "active", is_deleted: { $ne: true } } },
        {
          $lookup: {
            from: "models",
            localField: "model_id",
            foreignField: "_id",
            as: "model_data",
          },
        },
        {
          $lookup: {
            from: "brands",
            localField: "brand_id",
            foreignField: "_id",
            as: "brand_data",
          },
        },
        { $unwind: { path: "$model_data", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$brand_data", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "brands",
            localField: "model_data.brand_id",
            foreignField: "_id",
            as: "model_brand",
          },
        },
        { $unwind: { path: "$model_brand", preserveNullAndEmptyArrays: true } },
        {
          $match: {
            $or: [
              { "brand_data.is_hidden": { $ne: true } },
              { "model_brand.is_hidden": { $ne: true } },
            ],
          },
        },
      ])
      .toArray();

    const brandGroups: Record<string, any> = {};
    (products || []).forEach((p) => {
      const productBrand = p.brand_data;
      const modelBrand = p.model_brand;
      const hidden = productBrand?.is_hidden || modelBrand?.is_hidden;
      if (hidden) return;

      const brandId = p.brand_id || modelBrand?._id?.toString() || "generic";
      const brandName = productBrand?.name || modelBrand?.name || "Other";
      const brandLogo = productBrand?.logo_url || modelBrand?.logo_url || null;

      const modelId = p.model_id?.toString() || "__nomodel";
      const modelName = p.model_data?.name || null;
      const modelImage = p.model_data?.image_url || null;

      if (!brandGroups[brandId]) {
        brandGroups[brandId] = { brand_id: brandId, brand_name: brandName, brand_logo: brandLogo, models: {} };
      }
      if (!brandGroups[brandId].models[modelId]) {
        brandGroups[brandId].models[modelId] = {
          model_id: modelId,
          model_name: modelName,
          model_image: modelImage,
          products: [],
        };
      }
      brandGroups[brandId].models[modelId].products.push({
        id: p._id.toString(),
        name: p.name,
        price: p.price,
        quantity: p.quantity,
        image_url: p.image_url,
      });
    });

    const result = Object.values(brandGroups)
      .sort((a: any, b: any) => a.brand_name.localeCompare(b.brand_name))
      .map((brand: any) => ({ ...brand, models: Object.values(brand.models) }));

    return jsonResponse(result);
  });
}
