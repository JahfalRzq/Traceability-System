import { SerialPort } from "serialport";
import { asciiToHex } from "../utils/hexUtils";

const MOCK_PORT = process.env.MOCK_SERIAL_PORT || "COM4";
const BAUD_RATE = Number(process.env.SERIAL_BAUD_RATE) || 9600;
const INTERVAL_MS = 3000;

const port = new SerialPort({
  path: MOCK_PORT,
  baudRate: BAUD_RATE,
  dataBits: 8,
  stopBits: 1,
  parity: "none",
});

port.on("open", () => {
  console.log(`[mock-generator] Terhubung ke ${MOCK_PORT}, mulai kirim data dummy tiap ${INTERVAL_MS / 1000}s`);
});

port.on("error", (err) => {
  console.error("[mock-generator] Serial port error:", err.message);
});

function generateDummyWeight(): string {
  const status = Math.random() > 0.2 ? "ST" : "US";
  const weightType = "GS";
  const value = (Math.random() * 500 + 10).toFixed(2).padStart(9, "0");
  const unit = "kg";
  return `${status},${weightType},+${value},${unit}\r\n`;
}

setInterval(() => {
  const data = generateDummyWeight();
  const hexRepresentation = asciiToHex(data.trim());

  port.write(data, (err) => {
    if (err) {
      console.error("[mock-generator] Gagal kirim:", err.message);
      return;
    }
    console.log(`[mock-generator] Terkirim (HEX): ${hexRepresentation}`);
  });
}, INTERVAL_MS);