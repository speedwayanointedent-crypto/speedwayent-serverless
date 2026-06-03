import { connectToMongo } from "./mongodb";
import { ZodError } from "zod";

export class ApiError extends Error {
  statusCode: number;
  details: any;

  constructor(statusCode: number, message: string, details: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = "ApiError";
  }

  static badRequest(message: string, details?: any) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }
  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }
  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }
  static conflict(message: string) {
    return new ApiError(409, message);
  }
  static tooManyRequests(message = "Too many requests") {
    return new ApiError(429, message);
  }
  static internal(message = "Internal server error") {
    return new ApiError(500, message);
  }
  static serviceUnavailable(message = "Service temporarily unavailable") {
    return new ApiError(503, message);
  }
}

export function errorResponse(err: unknown): Response {
  let status = 500;
  let body: any = { error: "Internal server error" };
  let details: any = null;

  if (err instanceof ApiError) {
    status = err.statusCode;
    body = {
      error: status >= 500 && process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    };
    if (err.details) body.details = err.details;
  } else if (err instanceof Error) {
    if (process.env.NODE_ENV !== "production") {
      body = { error: err.message, stack: err.stack };
    }
    console.error("[api]", err);
  } else {
    console.error("[api] non-error thrown:", err);
  }

  return Response.json(body, { status });
}

export function jsonResponse<T = any>(data: T, init?: ResponseInit): Response {
  return Response.json(data, init);
}

export async function withErrorHandling<T = any>(fn: () => Promise<Response>): Promise<Response> {
  try {
    await connectToMongo();
    return await fn();
  } catch (err) {
    if (err instanceof ZodError) {
      const message = err.issues
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("; ");
      return Response.json(
        { error: message || "Invalid request", details: err.issues },
        { status: 400 }
      );
    }
    if (err instanceof Error && err.message?.includes("MONGODB_URI is not configured")) {
      return Response.json({ error: "Server is missing MONGODB_URI environment variable" }, { status: 500 });
    }
    return errorResponse(err);
  }
}
