import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import {
  UserRoleAssignment,
  UserRole,
  ScaleArea,
  GLOBAL_ROLES,
  SCALE_AREA_ROLES,
} from "../entities/UserRoleAssignment";
import { JwtPayload, RoleAssignmentClaim } from "../types/auth.types";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";
const SALT_ROUNDS = 10;

function userRepo() {
  return AppDataSource.getRepository(User);
}

function roleRepo() {
  return AppDataSource.getRepository(UserRoleAssignment);
}

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function createUser(params: {
  username: string;
  password: string;
  fullName: string;
}): Promise<User> {
  const existing = await userRepo().findOne({ where: { username: params.username } });
  if (existing) {
    throw new Error(`Username "${params.username}" sudah dipakai`);
  }

  const user = userRepo().create({
    username: params.username,
    passwordHash: await hashPassword(params.password),
    fullName: params.fullName,
    isActive: true,
  });
  return userRepo().save(user);
}

// Menambahkan 1 role assignment ke user, dengan validasi scope:
// - role GLOBAL (GL/MANAGER/ADMIN_DASHBOARD) -> scaleArea WAJIB null
// - role SCALE_AREA (ADMIN_SCALE/WEIGHING_OPERATOR/PIC) -> scaleArea WAJIB diisi
export async function assignRole(params: {
  userId: string;
  role: UserRole;
  scaleArea?: ScaleArea | null;
}): Promise<UserRoleAssignment> {
  const { userId, role } = params;
  const scaleArea = params.scaleArea ?? null;

  if (GLOBAL_ROLES.includes(role) && scaleArea !== null) {
    throw new Error(`Role "${role}" adalah role global, scaleArea harus kosong`);
  }
  if (SCALE_AREA_ROLES.includes(role) && scaleArea === null) {
    throw new Error(`Role "${role}" wajib diisi scaleArea (ALMC/DC/TRUCK_SCALE)`);
  }

  const user = await userRepo().findOne({ where: { id: userId } });
  if (!user) {
    throw new Error("User tidak ditemukan");
  }

  const assignment = roleRepo().create({ userId, role, scaleArea });
  return roleRepo().save(assignment);
}

export async function login(
  username: string,
  password: string
): Promise<{ token: string; user: User; roles: RoleAssignmentClaim[] }> {
  const user = await userRepo().findOne({
    where: { username },
    relations: { roleAssignments: true },
  });

  if (!user || !user.isActive) {
    throw new Error("Username atau password salah");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Username atau password salah");
  }

  const roles: RoleAssignmentClaim[] = user.roleAssignments.map((assignment) => ({
    role: assignment.role,
    scaleArea: assignment.scaleArea,
  }));

  if (roles.length === 0) {
    throw new Error("User belum memiliki role, hubungi admin");
  }

  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    roles,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

  return { token, user, roles };
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}