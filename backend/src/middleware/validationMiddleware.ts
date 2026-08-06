import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validate = (schema: ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issuesList = error.issues || (error as any).errors || [];
        const formatted = issuesList.map((e) => `${e.path.join(".") || "payload"}: ${e.message}`).join("; ");
        return res.status(400).json({ error: "Validation Error", details: formatted, issues: issuesList });
      }
      return res.status(400).json({ error: "Invalid request payload." });
    }
  };
};
