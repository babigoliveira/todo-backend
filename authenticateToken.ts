import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

if (JWT_SECRET === undefined) {
  throw new Error("JWT_SECRET não está definido no .env");
}

interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];

  if (!authHeader?.startsWith("Bearer")) {
    res.status(401).send({ error: "Formato do token inválido" });
    return;
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !decoded) {
      res.status(403).send({ error: "Token inválido ou expirado" });
      return;
    }

    req.user = decoded;
    next();
  });
}
