import fs from "fs";
import path from "path";
import { ICctvProvider, CapturedSnapshot } from "./cctvService";

const SNAPSHOT_DIR = path.join(__dirname, "../../logs/cctv-snapshots");

function ensureSnapshotDirExists() {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
}

export class MockCctvProvider implements ICctvProvider {
  async captureSnapshot(stationCode: string): Promise<CapturedSnapshot> {
    ensureSnapshotDirExists();

    const capturedAt = new Date();
    const timestamp = capturedAt.toISOString().replace(/[:.]/g, "-");
    const fileName = `${stationCode}_${timestamp}.txt`; // placeholder, ganti .jpg pas real kamera
    const filePath = path.join(SNAPSHOT_DIR, fileName);

    // Simulasi capture: tulis file placeholder berisi metadata
    // (real provider nanti nulis binary JPEG asli dari kamera)
    const placeholderContent = `MOCK CCTV SNAPSHOT
Station: ${stationCode}
Captured at: ${capturedAt.toISOString()}
(Ini placeholder — real kamera akan simpan file .jpg asli di sini)`;

    fs.writeFileSync(filePath, placeholderContent);

    console.log(`[cctv-mock] Snapshot dibuat: ${fileName}`);

    return { filePath, capturedAt };
  }
}