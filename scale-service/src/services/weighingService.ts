import { AppDataSource } from "../config/database";
import { WeighingRecord, CurrentStage, ApprovalStatus } from "../entities/WeighingRecord";
import { ParsedWeighingData } from "../types/weighing.types";
import { validateAgainstExistingSystems } from "./existingSystemValidationService";


const weighingRepo = AppDataSource.getRepository(WeighingRecord);

// Buffer sekarang per-station (Map), bukan 1 variable global lagi
const latestReadingsByStation = new Map<string, ParsedWeighingData>();

export function updateLatestReading(stationCode: string, data: ParsedWeighingData) {
  if (data.status === "STABLE") {
    latestReadingsByStation.set(stationCode, data);
  }
}

export function getLatestReading(stationCode: string): ParsedWeighingData | null {
  return latestReadingsByStation.get(stationCode) ?? null;
}

export function clearLatestReading(stationCode: string) {
  latestReadingsByStation.delete(stationCode);
}

function assertStageMatches(record: WeighingRecord, stage: CurrentStage) {
  if (record.currentStage !== stage) {
    throw new Error(
      `Stage tidak sesuai: record sedang di stage "${record.currentStage}", tapi request untuk stage "${stage}"`
    );
  }
}

export async function startWeighingSession(deliveryBarcode: string, stage: CurrentStage) {

  // Validasi ulang setiap kali scan, di stage manapun
  const validation = await validateAgainstExistingSystems(deliveryBarcode);

  if (!validation.isValid) {
    throw new Error(`Validasi gagal: ${validation.reason}`);
  }

  let record = await weighingRepo.findOneBy({ deliveryBarcode });

  if (!record) {
    record = weighingRepo.create({ deliveryBarcode, currentStage: stage });
  }

  // ↓ INI YANG HILANG — tulis hasil validasi ke record, setiap kali scan
  record.isValidatedWithExistingSystem = true;
  record.materialLotBatch = validation.materialLotBatch ?? null;
  record.poNumber = validation.poNumber ?? null;

  await weighingRepo.save(record);

  return record;
}

export async function submitWeighing(
  recordId: string,
  stage: CurrentStage,
  operatorName: string,
  stationCode: string
) {
  const record = await weighingRepo.findOneBy({ id: recordId });
  if (!record) throw new Error("Record tidak ditemukan");

  assertStageMatches(record, stage);

  const latestStableReading = getLatestReading(stationCode);
  if (!latestStableReading) {
    throw new Error(`Belum ada nilai timbangan stabil dari station "${stationCode}"`);
  }

  const now = new Date();

  if (stage === CurrentStage.ALMC) {
    record.almcWeightValue = latestStableReading.value;
    record.almcRawAsciiPayload = latestStableReading.rawPayload;
    record.almcCctvSnapshotUrl = latestStableReading.cctvSnapshotUrl ?? null; // ← baru
    record.almcSubmittedBy = operatorName;
    record.almcSubmittedAt = now;
    record.almcApprovalStatus = ApprovalStatus.PENDING;
    record.almcRejectionReason = null; // ← baru: reset sisa reject sebelumnya
  } else if (stage === CurrentStage.DC) {
    record.dcWeightValue = latestStableReading.value;
    record.dcRawAsciiPayload = latestStableReading.rawPayload;
    record.dcCctvSnapshotUrl = latestStableReading.cctvSnapshotUrl ?? null; // ← baru
    record.dcSubmittedBy = operatorName;
    record.dcSubmittedAt = now;
    record.dcApprovalStatus = ApprovalStatus.PENDING;
    record.dcRejectionReason = null; // ← baru: reset sisa reject sebelumnya
  } else if (stage === CurrentStage.TRUCK_SCALE) {
    record.truckScaleWeightValue = latestStableReading.value;
    record.truckScaleRawAsciiPayload = latestStableReading.rawPayload;
    record.truckScaleCctvSnapshotUrl = latestStableReading.cctvSnapshotUrl ?? null; // ← baru
    record.truckScaleSubmittedBy = operatorName;
    record.truckScaleSubmittedAt = now;
    record.truckScaleApprovalStatus = ApprovalStatus.PENDING;
    record.truckScaleRejectionReason = null; // ← baru: reset sisa reject sebelumnya
  }

  await weighingRepo.save(record);
  clearLatestReading(stationCode);
  return record;
}

export async function approveWeighing(recordId: string, stage: CurrentStage, approverName: string) {
  const record = await weighingRepo.findOneBy({ id: recordId });
  if (!record) throw new Error("Record tidak ditemukan");

  assertStageMatches(record, stage);

  const now = new Date();

  if (stage === CurrentStage.ALMC) {
    record.almcApprovalStatus = ApprovalStatus.APPROVED;
    record.almcApprovedBy = approverName;
    record.almcApprovedAt = now;
    record.currentStage = CurrentStage.DC;
  } else if (stage === CurrentStage.DC) {
    record.dcApprovalStatus = ApprovalStatus.APPROVED;
    record.dcApprovedBy = approverName;
    record.dcApprovedAt = now;
    record.currentStage = CurrentStage.TRUCK_SCALE;
  } else if (stage === CurrentStage.TRUCK_SCALE) {
    record.truckScaleApprovalStatus = ApprovalStatus.APPROVED;
    record.truckScaleApprovedBy = approverName;
    record.truckScaleApprovedAt = now;
    record.currentStage = CurrentStage.COMPLETED;
    record.isPublishedToPublicWeb = true;
  }

  await weighingRepo.save(record);
  return record;
}

export async function rejectWeighing(
  recordId: string,
  stage: CurrentStage,
  approverName: string,
  reason: string
) {
  const record = await weighingRepo.findOneBy({ id: recordId });
  if (!record) throw new Error("Record tidak ditemukan");

  assertStageMatches(record, stage);

  if (stage === CurrentStage.ALMC) {
    record.almcApprovalStatus = ApprovalStatus.REJECTED;
    record.almcRejectionReason = reason;
  } else if (stage === CurrentStage.DC) {
    record.dcApprovalStatus = ApprovalStatus.REJECTED;
    record.dcRejectionReason = reason;
  } else if (stage === CurrentStage.TRUCK_SCALE) {
    record.truckScaleApprovalStatus = ApprovalStatus.REJECTED;
    record.truckScaleRejectionReason = reason;
  }

  await weighingRepo.save(record);
  return record;
}