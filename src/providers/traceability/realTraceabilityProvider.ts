import axios from "axios";
import { ITraceabilityProvider } from "./ITraceabilityProvider";
import { TraceabilityInfo } from "../../types/existingSystem.types";

const BASE_URL = process.env.TRACEABILITY_API_BASE_URL;
const API_KEY = process.env.TRACEABILITY_API_KEY;

export class RealTraceabilityProvider implements ITraceabilityProvider {
  async getMaterialInfo(deliveryBarcode: string): Promise<TraceabilityInfo | null> {
    try {
      // ASUMSI kontrak API — sesuaikan begitu dokumentasi API asli tersedia:
      // GET {BASE_URL}/materials/{barcode}
      // Response diharapkan: { materialLotBatch, materialName, source, destination, isValid }
      const response = await axios.get(`${BASE_URL}/materials/${deliveryBarcode}`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
        timeout: 5000,
      });

      const data = response.data;

      return {
        materialLotBatch: data.materialLotBatch ?? data.lotBatch,
        materialName: data.materialName ?? data.itemName,
        source: data.source,
        destination: data.destination,
        isValid: true,
      };
    } catch (err: any) {
      if (err.response?.status === 404) {
        return {
          materialLotBatch: "",
          materialName: "",
          source: "",
          destination: "",
          isValid: false,
          invalidReason: "Barcode tidak ditemukan di sistem traceability",
        };
      }
      console.error("[real-traceability] Gagal hubungi API:", err.message);
      throw new Error("Sistem traceability tidak dapat diakses saat ini");
    }
  }
}