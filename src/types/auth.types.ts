import { UserRole, ScaleArea } from "../entities/UserRoleAssignment";

export interface RoleAssignmentClaim {
  role: UserRole;
  scaleArea: ScaleArea | null;
}

// Payload yang disimpan di dalam JWT — dibawa di tiap request setelah login,
// jadi middleware nggak perlu query DB ulang tiap request untuk cek role.
export interface JwtPayload {
  userId: string;
  username: string;
  fullName: string;
  roles: RoleAssignmentClaim[];
}

export interface LoginRequestBody {
  username: string;
  password: string;
}

export interface LoginResponseBody {
  token: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    roles: RoleAssignmentClaim[];
  };
}