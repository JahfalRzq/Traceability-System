import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import { startSerialListener } from "./services/serialListenerService";
import { startRawFileWatcher } from "./services/rawFileWatcherService";
import { ParsedWeighingData } from "./types/weighing.types";
import { MockCctvProvider } from "./services/cctvMockProvider"; // sesuaikan path

const STATION_CODE = process.env.STATION_CODE;
const CENTRAL_API_BASE_URL = process.env.CENTRAL_API_BASE_URL;

if (!STATION_CODE || !CENTRAL_API_BASE_URL) {
  console.error("STATION_CODE dan CENTRAL_API_BASE_URL wajib diisi di .env");
  process.exit(1);
}

const cctvProvider = new MockCctvProvider(); // nanti ganti: new RealCctvProvider(camConfig)

async function pushReadingToCentral(data: ParsedWeighingData) {
  try {
    let cctvSnapshotPath: string | null = null;

    // Capture cuma pas STABLE — tidak perlu tiap baris data (yang UNSTABLE dilewati)
    if (data.status === "STABLE") {
      try {
        const snapshot = await cctvProvider.captureSnapshot(STATION_CODE!);
        cctvSnapshotPath = snapshot.filePath;
      } catch (cctvErr: any) {
        console.error(`[edge-agent] Gagal capture CCTV:`, cctvErr.message);
        // tetap lanjut push reading meskipun CCTV gagal — jangan blokir alur timbangan
      }
    }

    await axios.post(
      `${CENTRAL_API_BASE_URL}/api/weighing/push-reading`,
      { ...data, cctvSnapshotUrl: cctvSnapshotPath },
      { headers: { "x-station-id": STATION_CODE } }
    );
    console.log(`[edge-agent] Berhasil push reading ke central: ${data.value}${data.unit}`);
  } catch (err: any) {
    console.error(`[edge-agent] Gagal push ke central:`, err.message);
  }
}

console.log(`[edge-agent] Menjalankan edge agent untuk station: ${STATION_CODE}`);
startSerialListener();
startRawFileWatcher(pushReadingToCentral);