import { AppDataSource } from "../config/database";
import { WeighingRecord } from "../entities/WeighingRecord";

const weighingRepo = AppDataSource.getRepository(WeighingRecord);

export interface DashboardQueryOptions {
  page?: number;
  limit?: number;
  stage?: string;
  fromDate?: string;
  toDate?: string;
}

// Public Dashboard: SEMUA record, semua stage, real-time monitoring internal
export async function getDashboardRecords(options: DashboardQueryOptions) {
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 20, 100); // cap biar tidak query berlebihan
  const skip = (page - 1) * limit;

  const qb = weighingRepo.createQueryBuilder("record");

  if (options.stage) {
    qb.andWhere("record.currentStage = :stage", { stage: options.stage });
  }
  if (options.fromDate) {
    qb.andWhere("record.createdAt >= :fromDate", { fromDate: options.fromDate });
  }
  if (options.toDate) {
    qb.andWhere("record.createdAt <= :toDate", { toDate: options.toDate });
  }

  qb.orderBy("record.updatedAt", "DESC").skip(skip).take(limit);

  const [data, total] = await qb.getManyAndCount();

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// Public Web: CUMA record yang sudah COMPLETED & isPublishedToPublicWeb = true
export async function getPublishedRecords(options: DashboardQueryOptions) {
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const qb = weighingRepo
    .createQueryBuilder("record")
    .where("record.isPublishedToPublicWeb = :published", { published: true });

  if (options.fromDate) {
    qb.andWhere("record.createdAt >= :fromDate", { fromDate: options.fromDate });
  }
  if (options.toDate) {
    qb.andWhere("record.createdAt <= :toDate", { toDate: options.toDate });
  }

  qb.orderBy("record.updatedAt", "DESC").skip(skip).take(limit);

  const [data, total] = await qb.getManyAndCount();

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}