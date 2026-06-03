import { type NextRequest } from "next/server";
import { collections } from "@/lib/mongodb";
import { withErrorHandling } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, "admin");
    const data = await collections
      .products()
      .aggregate([
        { $match: { is_deleted: { $ne: true } } },
        { $lookup: { from: "categories", localField: "category_id", foreignField: "_id", as: "category_data" } },
        { $lookup: { from: "brands", localField: "brand_id", foreignField: "_id", as: "brand_data" } },
        { $lookup: { from: "models", localField: "model_id", foreignField: "_id", as: "model_data" } },
        { $lookup: { from: "years", localField: "year_id", foreignField: "_id", as: "year_data" } },
        { $sort: { created_at: -1 } },
      ])
      .toArray();

    const header = ["name", "category", "brand", "model", "year", "price", "cost_price", "quantity", "description", "image_url", "status"];
    const lines = [header.join(",")];
    data.forEach((p: any) => {
      const row = [
        p.name,
        p.category_data?.name || "",
        p.brand_data?.name || "",
        p.model_data?.name || "",
        p.year_data?.label || "",
        p.price,
        p.cost_price || "",
        p.quantity,
        (p.description || "").replace(/\n/g, " "),
        p.image_url || "",
        p.status,
      ];
      lines.push(row.join(","));
    });
    return new Response(lines.join("\n"), {
      headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=products.csv" },
    });
  });
}
