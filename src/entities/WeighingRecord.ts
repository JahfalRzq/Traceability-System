import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum CurrentStage {
  ALMC = "ALMC",
  DC = "DC",
  TRUCK_SCALE = "TRUCK_SCALE",
  COMPLETED = "COMPLETED",
}

export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

@Entity({ name: "weighing_records" })
export class WeighingRecord {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  deliveryBarcode!: string;

  @Column({ type: "varchar", length: 20, default: CurrentStage.ALMC })
  currentStage!: CurrentStage;

  @Column({ type: "varchar", length: 100, nullable: true })
  materialLotBatch!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  poNumber!: string | null;

  @Column({ type: "bit", default: false })
  isValidatedWithExistingSystem!: boolean;

  // ── Stage 1: ALMC ──
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  almcWeightValue!: number | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  almcCctvSnapshotUrl!: string | null;

  @Column({ type: "varchar", length: 200, nullable: true })
  almcRawAsciiPayload!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  almcSubmittedBy!: string | null;

  @Column({ type: "datetime", nullable: true })
  almcSubmittedAt!: Date | null;

  @Column({ type: "varchar", length: 20, default: ApprovalStatus.PENDING })
  almcApprovalStatus!: ApprovalStatus;

  @Column({ type: "varchar", length: 100, nullable: true })
  almcApprovedBy!: string | null;

  @Column({ type: "datetime", nullable: true })
  almcApprovedAt!: Date | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  almcRejectionReason!: string | null;

  // ── Stage 2: DC ──
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  dcWeightValue!: number | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  dcCctvSnapshotUrl!: string | null;

  @Column({ type: "varchar", length: 200, nullable: true })
  dcRawAsciiPayload!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  dcSubmittedBy!: string | null;

  @Column({ type: "datetime", nullable: true })
  dcSubmittedAt!: Date | null;

  @Column({ type: "varchar", length: 20, default: ApprovalStatus.PENDING })
  dcApprovalStatus!: ApprovalStatus;

  @Column({ type: "varchar", length: 100, nullable: true })
  dcApprovedBy!: string | null;

  @Column({ type: "datetime", nullable: true })
  dcApprovedAt!: Date | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  dcRejectionReason!: string | null;

  // ── Stage 3: Truck Scale ──
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  truckScaleWeightValue!: number | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  truckScaleCctvSnapshotUrl!: string | null;

  @Column({ type: "varchar", length: 200, nullable: true })
  truckScaleRawAsciiPayload!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  truckScaleSubmittedBy!: string | null;

  @Column({ type: "datetime", nullable: true })
  truckScaleSubmittedAt!: Date | null;

  @Column({ type: "varchar", length: 20, default: ApprovalStatus.PENDING })
  truckScaleApprovalStatus!: ApprovalStatus;

  @Column({ type: "varchar", length: 100, nullable: true })
  truckScaleApprovedBy!: string | null;

  @Column({ type: "datetime", nullable: true })
  truckScaleApprovedAt!: Date | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  truckScaleRejectionReason!: string | null;

  @Column({ type: "bit", default: false })
  isPublishedToPublicWeb!: boolean;

  @Column({ type: "varchar", length: 10, default: "kg" })
  weightUnit!: string;

  @CreateDateColumn({ type: "datetime2" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime2" })
  updatedAt!: Date;
}