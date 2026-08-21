import { PurchaseOrderInfo } from "../../types/existingSystem.types";

export interface IPOProvider {
  getPOInfo(materialLotBatch: string): Promise<PurchaseOrderInfo | null>;
}