export interface CapturedSnapshot {
  filePath: string;
  capturedAt: Date;
}

export interface ICctvProvider {
  captureSnapshot(stationCode: string): Promise<CapturedSnapshot>;
}