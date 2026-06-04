import { type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { collections, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { generateToken, COOKIE } from "@/lib/server-auth";
import { sendWelcomeEmail, sendLoginAlert, sendPasswordResetEmail } from "@/lib/email-service";

export const dynamic = "force-dynamic";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
  role: z.enum(["admin", "manager", "staff", "customer"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6),
});

function setAuthCookie(token: string) {
  return [COOKIE + "=" + token, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=604800"].join("; ");
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    const body = await req.json().catch(() => ({}));

    if (action === "signup") {
      const { email, password, full_name } = signupSchema.parse(body);
      const passwordHash = await bcrypt.hash(password, 10);
      const existing = await collections.users().findOne({ email });
      if (existing) throw ApiError.conflict("Email already registered");

      const role = "customer";
      const result = await collections.users().insertOne({
        email,
        full_name,
        role,
        password_hash: passwordHash,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      sendWelcomeEmail(email, full_name).catch((e) => console.error("[email] welcome failed", e));

      const token = generateToken({
        id: result.insertedId.toString(),
        email,
        role,
        name: full_name,
      });

      const res = jsonResponse(
        {
          token,
          user: {
            id: result.insertedId.toString(),
            email,
            full_name,
            role,
            email_verified: true,
          },
        },
        { status: 201 }
      );
      res.headers.append("Set-Cookie", setAuthCookie(token));
      return res;
    }

    if (action === "login") {
      const { email, password } = loginSchema.parse(body);
      const profile = await collections.users().findOne({ email });
      if (!profile) throw ApiError.unauthorized("Invalid credentials");

      const valid = await bcrypt.compare(password, profile.password_hash);
      if (!valid) throw ApiError.unauthorized("Invalid credentials");

      sendLoginAlert(email).catch((e) => console.error("[email] login alert failed", e));

      const token = generateToken({
        id: profile._id.toString(),
        email: profile.email,
        role: profile.role,
        name: profile.full_name,
      });

      const res = jsonResponse({
        token,
        user: {
          id: profile._id.toString(),
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          email_verified: profile.email_verified,
        },
      });
      res.headers.append("Set-Cookie", setAuthCookie(token));
      return res;
    }

    if (action === "forgot-password") {
      const email = z.string().email().parse(body.email);
      const profile = await collections.users().findOne({ email });
      if (profile) {
        const JWT_SECRET = process.env.JWT_SECRET || "change-me";
        const token = jwt.sign(
          { sub: profile._id.toString(), type: "password_reset" },
          JWT_SECRET,
          { expiresIn: "30m" }
        );
        const resetLink = `${process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || ""}/reset-password?token=${token}`;
        sendPasswordResetEmail(email, resetLink).catch((e) => console.error("[email] reset failed", e));
      }
      return jsonResponse({ message: "If that email exists, a reset link was sent." });
    }

    if (action === "reset-password") {
      const { token, password } = resetSchema.parse(body);
      const JWT_SECRET = process.env.JWT_SECRET || "change-me";
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.type !== "password_reset") throw ApiError.badRequest("Invalid reset token");

      const passwordHash = await bcrypt.hash(password, 10);
      const result = await collections.users().updateOne(
        { _id: toObjectId(decoded.sub) as any },
        { $set: { password_hash: passwordHash, updated_at: new Date() } }
      );
      if (result.matchedCount === 0) throw ApiError.notFound("User not found");
      return jsonResponse({ message: "Password updated successfully." });
    }

    throw ApiError.notFound("Unknown auth action");
  });
}
