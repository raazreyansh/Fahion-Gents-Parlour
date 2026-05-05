import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { HttpError } from "./errors.js";
import { supabase } from "./supabase.js";

export type UserRole = "customer" | "owner" | "staff";

export type AuthPayload = {
  sub: string;
  role: UserRole;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function signAccessToken(payload: AuthPayload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "24h" });
}

export function authRequired(request: Request, _response: Response, next: NextFunction) {
  const header = request.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) throw new HttpError(401, "Missing bearer token", "auth_required");

  try {
    request.user = jwt.verify(token, config.jwtSecret) as AuthPayload;
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired token", "invalid_token");
  }
}

export async function adminRequired(request: Request, _response: Response, next: NextFunction) {
  try {
    if (!request.user) throw new HttpError(401, "Missing authenticated user", "auth_required");
    
    // For high security, we verify the role against the database
    const { data: user, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", request.user.sub)
      .single();

    if (error || !user || (user.role !== "owner" && user.role !== "staff")) {
      throw new HttpError(403, "Admin role required", "admin_required");
    }
    
    next();
  } catch (error) {
    next(error);
  }
}
