import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("[Unhandled Express Error]:", err);

  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === "production"
    ? "An unexpected error occurred on the server."
    : (err.message || "Internal Server Error");

  res.status(statusCode).json({
    error: message,
    ...(err.details ? { details: err.details } : {})
  });
}
