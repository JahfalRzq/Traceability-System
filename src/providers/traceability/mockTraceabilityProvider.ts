import { ITraceabilityProvider } from "./traceabilityProvider.interface";
import { TraceabilityInfo } from "../../types/existingSystem.types";

// Fixture data untuk skenario testing yang deterministik
const TRACEABILITY_FIXTURES: Record<string, TraceabilityInfo> = {
  "DEL-NOTFOUND-TEST": {
    materialLotBatch: "",
    materialName: "",
    source: "",
    destination: "",
    isValid: false,
    invalidReason: "Barcode tidak ditemukan di sistem traceability",
  },
  "DEL-PO-CLOSED-TEST": {
  materialLotBatch: "LOT-CLOSED-TEST",
  materialName: "Steel NG Parts (Gram Gear&Shaft)",
  source: "Assembly Line 1",
  destination: "Scrap Yard",
  isValid: true, // traceability-nya valid, yang gagal itu PO-nya
},
};

export class MockTraceabilityProvider implements ITraceabilityProvider {
  async getMaterialInfo(deliveryBarcode: string): Promise<TraceabilityInfo | null> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Cek fixture dulu (skenario testing yang sudah ditentukan)
    if (TRACEABILITY_FIXTURES[deliveryBarcode]) {
      console.log(`[mock-traceability] Menggunakan fixture untuk: ${deliveryBarcode}`);
      return TRACEABILITY_FIXTURES[deliveryBarcode];
    }

    // Default: simulasi barcode ditemukan & valid (perilaku normal, sesuai real case)
    console.log(`[mock-traceability] Ditemukan data untuk barcode: ${deliveryBarcode}`);
    return {
      materialLotBatch: `LOT-${deliveryBarcode.slice(-6)}`,
      materialName: "Steel NG Parts (Gram Gear&Shaft)",
      source: "Assembly Line 1",
      destination: "Scrap Yard",
      isValid: true,
    };
  }
}