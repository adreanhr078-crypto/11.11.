import { Request, Response, NextFunction } from "express";
import { adminApp } from "../lib/firebase-admin";

export type AuthenticatedRequest = Request & {
  uid?: string;
};

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "missing_token", message: "مطلوب توكن مصادقة." });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({ error: "invalid_token", message: "توكن المصادقة غير صالح." });
  }

  try {
    const decoded = await adminApp.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "invalid_token", message: "توكن المصادقة غير صالح أو منتهي." });
  }
}
