import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "http_error"
  ) {
    super(message);
  }
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return response.status(400).json({ error: "validation_error", details: error.flatten() });
  }

  if (error instanceof HttpError) {
    return response.status(error.status).json({ error: error.code, message: error.message });
  }

  console.error(error);
  return response.status(500).json({ error: "internal_error", message: "Something went wrong" });
}
