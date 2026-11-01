import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

export const errorMiddleware = (
  err: Error,
  req: Request, 
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  const message = err instanceof AppError ? err.message : "Internal server error"

  return res.status(statusCode).json({
    success: false, 
    message
  })
}