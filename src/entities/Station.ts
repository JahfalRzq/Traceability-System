import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";
import { CurrentStage } from "./WeighingRecord";

@Entity({ name: "stations" })
export class Station {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 50, unique: true })
  stationCode!: string; // contoh: "ALMC-01", "DC-01", "TRUCKSCALE-01"

  @Column({ type: "varchar", length: 20 })
  assignedStage!: CurrentStage; // stage yang boleh dioperasikan mini PC ini

  @Column({ type: "varchar", length: 45, nullable: true })
  allowedIpAddress!: string | null; // opsional, lapis kedua validasi (IP mini PC)

  @Column({ type: "bit", default: true })
  isActive!: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  description!: string | null;

  @CreateDateColumn({ type: "datetime2" })
  createdAt!: Date;
}