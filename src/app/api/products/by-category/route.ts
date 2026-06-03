import { collections } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandling(async () => {
    const categories = await collections.categories()
      .find({})
      .project({ _id: 1, name: 1, image_url: 1 })
      .toArray();

    const allProducts = await collections.products().find({ is_deleted: { $ne: true } }).toArray();
    const countMap: Record<string, number> = {};
    allProducts.forEach((p) => {
      if (p.category_id) {
        const key = String(p.category_id);
        countMap[key] = (countMap[key] || 0) + 1;
      }
    });

    const result = categories.map((cat) => ({
      _id: cat._id.toString(),
      id: cat._id.toString(),
      name: cat.name,
      image_url: cat.image_url,
      product_count: countMap[cat._id.toString()] || 0,
    }));

    return jsonResponse(result);
  });
}
