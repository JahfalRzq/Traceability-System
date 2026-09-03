import axios from "axios";
import { IPOProvider } from "./poProvider.interface";
import { PurchaseOrderInfo } from "../../types/existingSystem.types";

const BASE_URL = process.env.PO_API_BASE_URL;
const API_KEY = process.env.PO_API_KEY;

export class RealPOProvider implements IPOProvider {
  async getPOInfo(materialLotBatch: string): Promise<PurchaseOrderInfo | null> {
    try {
      // ASUMSI kontrak API — sesuaikan begitu dokumentasi API asli tersedia:
      // GET {BASE_URL}/orders?lotBatch={materialLotBatch}
      // Response diharapkan: { poNumber, supplierName, itemMaterial, poStatus }
      const response = await axios.get(`${BASE_URL}/orders`, {
        params: { lotBatch: materialLotBatch },
        headers: { Authorization: `Bearer ${API_KEY}` },
        timeout: 5000,
      });

      const data = response.data;
      const isOpen = data.poStatus === "OPEN";

      return {
        poNumber: data.poNumber,
        supplierName: data.supplierName,
        itemMaterial: data.itemMaterial,
        poStatus: data.poStatus,
        isValid: isOpen,
        invalidReason: isOpen ? undefined : `PO berstatus ${data.poStatus}, tidak bisa menerima scrap baru`,
      };
    } catch (err: any) {
      if (err.response?.status === 404) {
        return {
          poNumber: "",
          supplierName: "",
          itemMaterial: "",
          poStatus: "CLOSED",
          isValid: false,
          invalidReason: "Data PO tidak ditemukan",
        };
      }
      console.error("[real-po] Gagal hubungi API:", err.message);
      throw new Error("Sistem PO tidak dapat diakses saat ini");
    }
  }
}