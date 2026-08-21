export function asciiToHex(ascii: string): string {
  return Buffer.from(ascii, "ascii").toString("hex");
}

export function hexToAscii(hex: string): string {
  return Buffer.from(hex, "hex").toString("ascii");
}