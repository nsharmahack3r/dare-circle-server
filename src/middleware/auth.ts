import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
  };
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = authService.verifyToken(token);
    req.user = {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Socket token verification (returns payload or null)
export function verifySocketToken(token: string) {
  try {
    return authService.verifyToken(token);
  } catch {
    return null;
  }
}
