import { type NextRequest } from "next/server";
import { collections, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling } from "@/lib/errors";
import { requireAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requireAuth(req);
    const { id } = await params;
    const result = await collections
      .wishlistItems()
      .deleteOne({ _id: toObjectId(id) as any });
    if (result.deletedCount === 0) throw ApiError.notFound("Item not found");
    return new Response(null, { status: 204 });
  });
}
