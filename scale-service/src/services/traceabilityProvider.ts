import { TraceabilityInfo } from "../types/existingSystem.types";

export interface ITraceabilityProvider {
  getMaterialInfo(deliveryBarcode: string): Promise<TraceabilityInfo | null>;
}


