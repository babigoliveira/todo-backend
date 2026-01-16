import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

if (JWT_SECRET === undefined) {
  throw new Error("JWT_SECRET não está definido no .env");
}

export interface AuthenticatedRequest extends Request {
  user: { id: string };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.todo_token;

  if (!token) {
    res.status(401).json({ message: "Token não autnenticado" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    req.user = { id: decoded.userId };
    next();
  } catch {
    res.status(403).json({ message: "Token inválido ou expirado" });
  }
}
