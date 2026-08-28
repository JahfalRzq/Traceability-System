import { MockTraceabilityProvider } from "../providers/traceability/mockTraceabilityProvider";
import { RealTraceabilityProvider } from "../providers/traceability/realTraceabilityProvider";
import { MockPOProvider } from "../providers/po/mockPOProvider";
import { RealPOProvider } from "../providers/po/realPOProvider";
import { ExistingSystemValidationResult } from "../types/existingSystem.types";
import { ITraceabilityProvider } from "../providers/traceability/ITraceabilityProvider";
import { IPOProvider } from "../providers/po/IPOProvider";

const PROVIDER_MODE = process.env.PROVIDER_MODE || "mock";

const traceabilityProvider: ITraceabilityProvider =
  PROVIDER_MODE === "real" ? new RealTraceabilityProvider() : new MockTraceabilityProvider();

const poProvider: IPOProvider =
  PROVIDER_MODE === "real" ? new RealPOProvider() : new MockPOProvider();

console.log(`[existing-system-validation] Provider mode: ${PROVIDER_MODE}`);

export async function validateAgainstExistingSystems(
  deliveryBarcode: string
): Promise<ExistingSystemValidationResult> {
  const traceabilityInfo = await traceabilityProvider.getMaterialInfo(deliveryBarcode);

  if (!traceabilityInfo || !traceabilityInfo.isValid) {
    return {
      isValid: false,
      reason: traceabilityInfo?.invalidReason ?? "Data tidak ditemukan di sistem traceability",
    };
  }

  const poInfo = await poProvider.getPOInfo(traceabilityInfo.materialLotBatch);

  if (!poInfo || !poInfo.isValid) {
    return {
      isValid: false,
      materialLotBatch: traceabilityInfo.materialLotBatch,
      reason: poInfo?.invalidReason ?? "Data tidak ditemukan di sistem PO",
    };
  }

  return {
    isValid: true,
    materialLotBatch: traceabilityInfo.materialLotBatch,
    poNumber: poInfo.poNumber,
  };
}