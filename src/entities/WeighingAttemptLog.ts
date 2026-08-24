import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { WeighingRecord, CurrentStage, ApprovalStatus } from "./WeighingRecord";

@Entity({ name: "weighing_attempt_logs" })
export class WeighingAttemptLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => WeighingRecord, { onDelete: "CASCADE" })
  @JoinColumn({ name: "weighingRecordId" })
  weighingRecord!: WeighingRecord;

  @Column({ type: "uniqueidentifier" })
  weighingRecordId!: string;

  @Column({ type: "varchar", length: 20 })
  stage!: CurrentStage;

  @Column({ type: "int" })
  attemptNumber!: number; // ke berapa kali percobaan submit di stage ini

  @Column({ type: "decimal", precision: 10, scale: 2 })
  weightValue!: number;

  @Column({ type: "varchar", length: 200, nullable: true })
  rawAsciiPayload!: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  cctvSnapshotUrl!: string | null;

  @Column({ type: "varchar", length: 100 })
  submittedBy!: string;

  @Column({ type: "datetime" })
  submittedAt!: Date;

  @Column({ type: "varchar", length: 20, default: ApprovalStatus.PENDING })
  result!: ApprovalStatus; // diupdate belakangan jadi APPROVED/REJECTED

  @Column({ type: "varchar", length: 100, nullable: true })
  reviewedBy!: string | null; // approver/rejector

  @Column({ type: "datetime", nullable: true })
  reviewedAt!: Date | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  rejectionReason!: string | null; // cuma keisi kalau result = REJECTED

  @CreateDateColumn({ type: "datetime2" })
  createdAt!: Date;
}