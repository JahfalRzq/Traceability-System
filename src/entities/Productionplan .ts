import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { ScaleArea } from "./UserRoleAssignment";

// Data rencana produksi dari PC Dept (existing system pihak client, belum bisa diakses).
// Kita simpan sendiri untuk sementara sebagai acuan validasi + bahan Plan vs Actual di dashboard.
// TRUCK_SCALE sengaja tidak dipakai di sini karena bukan departemen penghasil scrap,
// cuma checkpoint keluar.
@Entity({ name: "production_plans" })
export class ProductionPlan {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "date" })
  planDate!: string;

  @Column({ type: "varchar", length: 20 })
  scaleArea!: ScaleArea.ALMC | ScaleArea.DC | ScaleArea.TRUCK_SCALE; 

  @Column({ type: "decimal", precision: 12, scale: 2 })
  planProductionKg!: number;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  estimatedScrapPercent!: number;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  scrapTolerancePercent!: number;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  scrapRangeMinKg!: number;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  scrapRangeMaxKg!: number;

  @CreateDateColumn({ type: "datetime2" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime2" })
  updatedAt!: Date;
}