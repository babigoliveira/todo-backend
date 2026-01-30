import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não está definido no .env");
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.todo_token;

  if (!token) {
    res.status(401).json({ message: "Token não autenticado" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & {
      userId: string;
    };

    req.user = { id: decoded.userId };
    next();
  } catch {
    res.status(403).json({ message: "Token inválido ou expirado" });
  }
};
