import fs from "fs";
import path from "path";
import { parseWeighingFromHex } from "../utils/asciiParser";
import { ParsedWeighingData } from "../types/weighing.types";

const RAW_LOG_DIR = path.join(__dirname, "../../logs/raw");

function getTodayLogFilePath(): string {
  const today = new Date().toISOString().slice(0, 10);
  return path.join(RAW_LOG_DIR, `weighing-raw-${today}.log`);
}

export function startRawFileWatcher(onDataParsed: (data: ParsedWeighingData) => void) {
  const logFilePath = getTodayLogFilePath();
  let lastReadOffset = 0;

  // Tunggu file ada dulu (dibuat oleh serialListenerService saat data pertama masuk)
  const waitAndWatch = () => {
    if (!fs.existsSync(logFilePath)) {
      setTimeout(waitAndWatch, 500);
      return;
    }

    console.log(`[raw-file-watcher] Mulai watch: ${logFilePath}`);

    fs.watch(logFilePath, (eventType) => {
      if (eventType !== "change") return;

      fs.stat(logFilePath, (err, stats) => {
        if (err) return;

        // Baca cuma bagian baru yang ditambahkan sejak terakhir baca
        const stream = fs.createReadStream(logFilePath, {
          start: lastReadOffset,
          end: stats.size,
        });

        let chunk = "";
        stream.on("data", (data) => (chunk += data.toString()));
        stream.on("end", () => {
          lastReadOffset = stats.size;

          const lines = chunk.split("\n").filter((l) => l.trim() !== "");
          for (const hexLine of lines) {
            const parsed = parseWeighingFromHex(hexLine);
            if (parsed) {
              console.log("[raw-file-watcher] Berhasil di-parse dari file:", parsed);
              onDataParsed(parsed);
            }
          }
        });
      });
    });
  };

  waitAndWatch();
}