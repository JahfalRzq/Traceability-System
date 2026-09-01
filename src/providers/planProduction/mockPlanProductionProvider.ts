import { AppDataSource } from "../../config/database";
import { ProductionPlan } from "../../entities/Productionplan ";
import { IPlanProductionProvider } from "./planProductionProvider.interface";
import { PlanProductionInfo } from "../../types/existingSystem.types";

// Beda dengan MockTraceabilityProvider/MockPOProvider (fixture in-memory),
// provider ini baca dari tabel ProductionPlan kita sendiri, karena datanya
// perlu bisa diisi/diubah manual (lewat endpoint /api/mock/plan-production)
// untuk keperluan demo, sekaligus dipakai ulang oleh dashboard (Plan vs Actual).
// Nanti kalau real PC Dept API sudah bisa diakses, implementasi ini tinggal
// diganti RealPlanProductionProvider tanpa mengubah IPlanProductionProvider.
export class MockPlanProductionProvider implements IPlanProductionProvider {
  async getActivePlan(scaleArea: string, date: Date): Promise<PlanProductionInfo | null> {
    const repo = AppDataSource.getRepository(ProductionPlan);
    const planDate = date.toISOString().slice(0, 10); // yyyy-mm-dd

    const plan = await repo.findOne({ where: { scaleArea: scaleArea as any, planDate } });

    if (!plan) {
      return {
        scaleArea,
        planDate,
        planProductionKg: 0,
        estimatedScrapPercent: 0,
        scrapTolerancePercent: 0,
        scrapRangeMinKg: 0,
        scrapRangeMaxKg: 0,
        isValid: false,
        invalidReason: `Tidak ada rencana produksi aktif untuk area ${scaleArea} pada tanggal ${planDate}`,
      };
    }

    return {
      scaleArea: plan.scaleArea,
      planDate: plan.planDate,
      planProductionKg: Number(plan.planProductionKg),
      estimatedScrapPercent: Number(plan.estimatedScrapPercent),
      scrapTolerancePercent: Number(plan.scrapTolerancePercent),
      scrapRangeMinKg: Number(plan.scrapRangeMinKg),
      scrapRangeMaxKg: Number(plan.scrapRangeMaxKg),
      isValid: true,
    };
  }
}