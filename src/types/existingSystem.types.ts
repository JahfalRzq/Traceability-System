export interface TraceabilityInfo {
  materialLotBatch: string;
  materialName: string;
  source: string;
  destination: string;
  isValid: boolean;
  invalidReason?: string;
}

export interface PurchaseOrderInfo {
  poNumber: string;
  supplierName: string;
  itemMaterial: string;
  poStatus: "OPEN" | "CLOSED" | "CANCELLED";
  isValid: boolean;
  invalidReason?: string;
}

export interface ExistingSystemValidationResult {
  isValid: boolean;
  materialLotBatch?: string;
  poNumber?: string;
  reason?: string;
}

