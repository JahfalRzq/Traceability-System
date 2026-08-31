import {PlanProductionInfo} from "../../types/existingSystem.types";

export interface IPlanProductionProvider {
  getActivePlan(scaleArea: string, date: Date): Promise<PlanProductionInfo | null>;
}