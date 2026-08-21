export interface ParsedWeighingData {
  status: "STABLE" | "UNSTABLE";
  weightType: "GROSS" | "NET";
  value: number;
  unit: string;
  rawPayload: string;
  timestamp: Date;
  cctvSnapshotUrl?: string | null; // baru

}