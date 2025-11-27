// FILE: src/api/middlewares/validation.middleware.ts
import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

export const validate =
  (schema: AnyZodObject, source: "body" | "query" = "body") =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (source === "body") {
        req.body = await schema.parseAsync(req.body);
      } else {
        req.query = await schema.parseAsync(req.query);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          details: error.errors.map((e) => ({
            path: e.path,
            message: e.message,
          })),
        });
      } else {
        next(error);
      }
    }
  };
