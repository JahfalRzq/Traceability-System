// Jalankan manual sekali untuk isi user awal per role, buat testing/demo.
// Usage: ts-node-dev --transpile-only -r tsconfig-paths/register src/scripts/seedUsers.ts
import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import { AppDataSource } from "../config/database";
import { createUser, assignRole } from "../services/authService";
import { UserRole, ScaleArea } from "../entities/UserRoleAssignment";

interface SeedUserDef {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
  scaleArea: ScaleArea | null;
}

const SEED_USERS: SeedUserDef[] = [
  // ── Scale area: ALMC ──
  { username: "admin.almc", password: "password123", fullName: "Admin ALMC", role: UserRole.ADMIN_SCALE, scaleArea: ScaleArea.ALMC },
  { username: "operator.almc", password: "password123", fullName: "Operator ALMC", role: UserRole.WEIGHING_OPERATOR, scaleArea: ScaleArea.ALMC },
  { username: "pic.almc", password: "password123", fullName: "PIC ALMC", role: UserRole.PIC, scaleArea: ScaleArea.ALMC },

  // ── Scale area: DC ──
  { username: "admin.dc", password: "password123", fullName: "Admin DC", role: UserRole.ADMIN_SCALE, scaleArea: ScaleArea.DC },
  { username: "operator.dc", password: "password123", fullName: "Operator DC", role: UserRole.WEIGHING_OPERATOR, scaleArea: ScaleArea.DC },
  { username: "pic.dc", password: "password123", fullName: "PIC DC", role: UserRole.PIC, scaleArea: ScaleArea.DC },

  // ── Scale area: Truck Scale ──
  { username: "admin.truckscale", password: "password123", fullName: "Admin Truck Scale", role: UserRole.ADMIN_SCALE, scaleArea: ScaleArea.TRUCK_SCALE },
  { username: "operator.truckscale", password: "password123", fullName: "Operator Truck Scale", role: UserRole.WEIGHING_OPERATOR, scaleArea: ScaleArea.TRUCK_SCALE },
  { username: "pic.truckscale", password: "password123", fullName: "PIC Truck Scale", role: UserRole.PIC, scaleArea: ScaleArea.TRUCK_SCALE },

  // ── Dashboard (global) ──
  { username: "gl", password: "password123", fullName: "General Leader", role: UserRole.GL, scaleArea: null },
  { username: "manager", password: "password123", fullName: "Manager", role: UserRole.MANAGER, scaleArea: null },
  { username: "admin.dashboard", password: "password123", fullName: "Admin Dashboard", role: UserRole.ADMIN_DASHBOARD, scaleArea: null },
];

async function seed() {
  await AppDataSource.initialize();
  console.log("Database connected, mulai seeding user...");

  for (const def of SEED_USERS) {
    try {
      const user = await createUser({
        username: def.username,
        password: def.password,
        fullName: def.fullName,
      });
      await assignRole({ userId: user.id, role: def.role, scaleArea: def.scaleArea });
      console.log(`✓ ${def.username} (${def.role}${def.scaleArea ? " @ " + def.scaleArea : ""})`);
    } catch (err: any) {
      console.log(`✗ ${def.username} dilewati: ${err.message}`);
    }
  }

  console.log("Seeding selesai. Semua akun pakai password: password123");
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error("Seeding gagal:", err);
  process.exit(1);
});