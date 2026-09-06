import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface AuthenticatedUser {
  sub: string;
  username: string;
  fullName: string;
  role: string;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token tidak ditemukan, wajib login" });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token tidak valid atau sudah kedaluwarsa" });
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthenticatedUser;

    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: `Akses ditolak — role dibutuhkan: ${allowedRoles.join(" atau ")}`,
      });
    }

    next();
  };
}