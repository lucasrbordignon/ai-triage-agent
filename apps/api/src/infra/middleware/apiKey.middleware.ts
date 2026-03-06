import { Request, Response, NextFunction } from "express";

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-api-key"];

  if (!key || key !== process.env.API_KEY) {
    res.status(401).json({ error: "Não autorizado." });
    return;
  }

  next();
}