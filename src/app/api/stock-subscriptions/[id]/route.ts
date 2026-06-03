import { type NextRequest } from "next/server";
import { collections, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling } from "@/lib/errors";
import { requireAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const user = await requireAuth(req);
    const result = await collections.stockSubscriptions().deleteOne({
      _id: toObjectId(id) as any,
      user_id: user.id,
    });
    if (result.deletedCount === 0) {
      throw ApiError.notFound("Subscription not found");
    }
    return new Response(null, { status: 204 });
  });
}
