import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { HttpError } from "./errors.js";
import type { AppStore, UserRole } from "./store.js";

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
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "1h" });
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

export function adminRequired(store: AppStore) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user) throw new HttpError(401, "Missing authenticated user", "auth_required");
    const user = store.users.get(request.user.sub);
    if (!user || (user.role !== "owner" && user.role !== "staff")) {
      throw new HttpError(403, "Admin role required", "admin_required");
    }
    next();
  };
}
