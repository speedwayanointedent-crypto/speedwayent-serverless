import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const ADMIN_PATH_PREFIX = "/admin";
const AUTH_PATH_PREFIXES = ["/login", "/signup"];
const PROTECTED_ADMIN_ROLES = new Set(["admin", "manager", "staff"]);

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "change-me";
  return new TextEncoder().encode(secret);
}

async function verifyRole(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const tokenFromCookie = req.cookies.get("speedway_token")?.value;
  const tokenFromHeader = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const token = tokenFromCookie || tokenFromHeader;

  if (pathname.startsWith(ADMIN_PATH_PREFIX)) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    const role = await verifyRole(token);
    if (!role || !PROTECTED_ADMIN_ROLES.has(role)) {
      const url = req.nextUrl.clone();
      url.pathname = !role ? "/login" : "/";
      if (!role) url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (AUTH_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/")) && token) {
    const role = await verifyRole(token);
    if (role && PROTECTED_ADMIN_ROLES.has(role)) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/signup"],
};
