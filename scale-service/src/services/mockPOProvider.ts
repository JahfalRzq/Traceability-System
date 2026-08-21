import { IPOProvider } from "./poProvider";
import { PurchaseOrderInfo } from "../types/existingSystem.types";

// Fixture data untuk skenario testing yang deterministik (keyed by materialLotBatch)
const PO_FIXTURES: Record<string, PurchaseOrderInfo> = {
  "LOT-CLOSED-TEST": {
    poNumber: "PO-2026-9999",
    supplierName: "-",
    itemMaterial: "-",
    poStatus: "CLOSED",
    isValid: false,
    invalidReason: "PO sudah closed, tidak bisa menerima scrap baru",
  },
};

export class MockPOProvider implements IPOProvider {
  async getPOInfo(materialLotBatch: string): Promise<PurchaseOrderInfo | null> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (PO_FIXTURES[materialLotBatch]) {
      console.log(`[mock-po] Menggunakan fixture untuk lot batch: ${materialLotBatch}`);
      return PO_FIXTURES[materialLotBatch];
    }

    console.log(`[mock-po] Ditemukan PO untuk lot batch: ${materialLotBatch}`);
    return {
      poNumber: `PO-2026-${materialLotBatch.slice(-4)}`,
      supplierName: "PT Sumber Baja Sejahtera",
      itemMaterial: "Steel NG Parts",
      poStatus: "OPEN",
      isValid: true,
    };
  }
}