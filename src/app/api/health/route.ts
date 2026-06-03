import { NextResponse } from "next/server";
import { withErrorHandling, jsonResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandling(async () => {
    return jsonResponse({ status: "ok", timestamp: new Date().toISOString() });
  });
}
