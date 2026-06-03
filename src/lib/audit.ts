import { getDBAsync, toObjectId } from "./mongodb";
import type { NextRequest } from "next/server";

export type AuditLog = {
  action: string;
  resource?: string;
  resource_id?: string;
  user_id?: string | null;
  user_email?: string | null;
  details?: any;
  ip?: string | null;
  user_agent?: string | null;
  status?: "success" | "failure";
  created_at?: Date;
};

export async function logAudit(entry: AuditLog, req?: NextRequest): Promise<void> {
  try {
    const db = await getDBAsync();
    const doc: any = {
      ...entry,
      created_at: entry.created_at || new Date(),
    };
    if (req) {
      doc.ip = doc.ip || req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
      doc.user_agent = doc.user_agent || req.headers.get("user-agent");
    }
    await db.collection("audit_logs").insertOne(doc);
  } catch (err) {
    console.warn("[audit] failed to write log:", (err as Error).message);
  }
}
