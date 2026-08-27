import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User";

export enum UserRole {
  // ── Scope: SCALE_AREA (operasional per titik timbang) ──
  ADMIN_SCALE = "ADMIN_SCALE", // kelola user & config, hanya untuk scale area yang di-assign
  WEIGHING_OPERATOR = "WEIGHING_OPERATOR", // yang melakukan penimbangan
  PIC = "PIC", // penanggung jawab area, review data sebelum lanjut stage

  // ── Scope: GLOBAL (dashboard approval/reporting) ──
  GL = "GL",
  MANAGER = "MANAGER",
  ADMIN_DASHBOARD = "ADMIN_DASHBOARD", // kelola user & config dashboard, TIDAK bisa akses scale area
}

export const GLOBAL_ROLES: UserRole[] = [
  UserRole.GL,
  UserRole.MANAGER,
  UserRole.ADMIN_DASHBOARD,
];

export const SCALE_AREA_ROLES: UserRole[] = [
  UserRole.ADMIN_SCALE,
  UserRole.WEIGHING_OPERATOR,
  UserRole.PIC,
];

export enum ScaleArea {
  ALMC = "ALMC",
  DC = "DC",
  TRUCK_SCALE = "TRUCK_SCALE",
}

@Entity({ name: "user_role_assignments" })
export class UserRoleAssignment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, (user) => user.roleAssignments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "uniqueidentifier" })
  userId!: string;

  @Column({ type: "varchar", length: 30 })
  role!: UserRole;

  // Wajib null kalau role termasuk GLOBAL_ROLES.
  // Wajib diisi kalau role termasuk SCALE_AREA_ROLES.
  // Divalidasi di authService.assignRole(), bukan di level DB.
  @Column({ type: "varchar", length: 20, nullable: true })
  scaleArea!: ScaleArea | null;

  @CreateDateColumn({ type: "datetime2" })
  createdAt!: Date;
}