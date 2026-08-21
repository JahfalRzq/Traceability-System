export const serialConfig = {
  path: process.env.SERIAL_PORT || "COM3", // ganti sesuai virtual COM port kamu
  baudRate: Number(process.env.SERIAL_BAUD_RATE) || 9600,
  dataBits: 8 as const,
  stopBits: 1 as const,
  parity: "none" as const,
};