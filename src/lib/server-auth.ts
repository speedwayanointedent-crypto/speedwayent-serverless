import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
import { getDBAsync, toObjectId } from "./mongodb";
import { ApiError } from "./errors";

const JWT_SECRET = process.env.JWT_SECRET || "change-me";
const COOKIE_NAME = "speedway_token";

export type AuthUser = {
  id: string;
  email: string;
  role: "customer" | "admin" | "manager" | "staff";
  name?: string;
};

export function generateToken(payload: AuthUser | object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;
  return null;
}

export function getUserFromRequest(req: NextRequest): AuthUser | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const user = getUserFromRequest(req);
  if (!user) {
    throw ApiError.unauthorized("Authentication required");
  }
  return user;
}

export async function requireRole(req: NextRequest, allowed: string | string[]): Promise<AuthUser> {
  const user = await requireAuth(req);
  const allowedArr = Array.isArray(allowed) ? allowed : [allowed];
  if (!allowedArr.includes(user.role)) {
    throw ApiError.forbidden("Insufficient permissions");
  }
  return user;
}

export async function loadUserFromDb(user: AuthUser): Promise<AuthUser> {
  const db = await getDBAsync();
  const doc = await db.collection("users").findOne({ _id: toObjectId(user.id) as any });
  if (!doc) return user;
  return {
    id: doc._id.toString(),
    email: doc.email,
    role: doc.role,
    name: doc.name,
  };
}

export const COOKIE = COOKIE_NAME;
