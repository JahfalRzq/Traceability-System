import { MockTraceabilityProvider } from "../providers/traceability/mockTraceabilityProvider";
import { MockPOProvider } from "../providers/po/mockPOProvider";
import { ExistingSystemValidationResult } from "../types/existingSystem.types";

const traceabilityProvider = new MockTraceabilityProvider(); // nanti ganti: new RealTraceabilityProvider(config)
const poProvider = new MockPOProvider(); // nanti ganti: new RealPOProvider(config)

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