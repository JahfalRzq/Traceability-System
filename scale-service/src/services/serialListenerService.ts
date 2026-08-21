import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import fs from "fs";
import path from "path";
import { serialConfig } from "../config/serial";
import { asciiToHex } from "../utils/hexUtils";

const RAW_LOG_DIR = path.join(__dirname, "../../logs/raw");

function ensureLogDirExists() {
  if (!fs.existsSync(RAW_LOG_DIR)) {
    fs.mkdirSync(RAW_LOG_DIR, { recursive: true });
  }
}

function getTodayLogFilePath(): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(RAW_LOG_DIR, `weighing-raw-${today}.log`);
}

export function startSerialListener() {
  ensureLogDirExists();

  const port = new SerialPort({
    path: serialConfig.path,
    baudRate: serialConfig.baudRate,
    dataBits: serialConfig.dataBits,
    stopBits: serialConfig.stopBits,
    parity: serialConfig.parity,
  });

  const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

  port.on("open", () => {
    console.log(`[serial-listener] Listening di ${serialConfig.path}`);
  });

  port.on("error", (err) => {
    console.error("[serial-listener] Error:", err.message);
  });

  parser.on("data", (line: string) => {
    const hex = asciiToHex(line.trim());
    const logFilePath = getTodayLogFilePath();

    fs.appendFile(logFilePath, hex + "\n", (err) => {
      if (err) {
        console.error("[serial-listener] Gagal tulis ke raw log:", err.message);
        return;
      }
      console.log(`[serial-listener] Ditulis ke raw log (HEX): ${hex}`);
    });
  });

  return port;
}