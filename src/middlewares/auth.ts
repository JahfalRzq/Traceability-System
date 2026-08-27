import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/authService";
import { JwtPayload } from "../types/auth.types";
import { UserRole, ScaleArea } from "../entities/UserRoleAssignment";

/**
 * Level 1: cek JWT valid, tempel payload ke req.user.
 * Semua route yang butuh login pakai ini duluan.
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Header Authorization Bearer <token> wajib diisi" });
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = verifyToken(token);
    (req as any).user = payload as JwtPayload;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: "Token tidak valid atau sudah kedaluwarsa" });
  }
}

/**
 * Level 2a: untuk endpoint dashboard approval/reporting.
 * User harus punya salah satu role di allowedRoles dengan scaleArea = null (GLOBAL).
 * Dipakai setelah authenticate.
 */
export function requireGlobalRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as JwtPayload | undefined;
    if (!user) {
      return res.status(401).json({ error: "Belum login" });
    }

    const hasAccess = user.roles.some(
      (assignment) => assignment.scaleArea === null && allowedRoles.includes(assignment.role)
    );

    if (!hasAccess) {
      return res.status(403).json({
        error: `Butuh salah satu role global: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
}

/**
 * Level 2b: untuk endpoint operasional scale area (mis. /api/scale-area/:stage/...).
 * User harus punya salah satu role di allowedRoles yang di-scope ke scaleArea
 * yang sama dengan :stage pada URL param request ini.
 * Dipakai setelah authenticate.
 */
export function requireScaleAreaRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as JwtPayload | undefined;
    if (!user) {
      return res.status(401).json({ error: "Belum login" });
    }

    const requestedArea = req.params.stage as ScaleArea | undefined;
    if (!requestedArea) {
      return res.status(400).json({ error: "Parameter :stage wajib ada di URL" });
    }

    const hasAccess = user.roles.some(
      (assignment) => assignment.scaleArea === requestedArea && allowedRoles.includes(assignment.role)
    );

    if (!hasAccess) {
      return res.status(403).json({
        error: `Butuh salah satu role [${allowedRoles.join(", ")}] khusus untuk area "${requestedArea}"`,
      });
    }

    next();
  };
}