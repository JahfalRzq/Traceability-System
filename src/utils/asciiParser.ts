import { ParsedWeighingData } from "../types/weighing.types";
import { hexToAscii } from "./hexUtils";

export function parseWeighingAscii(rawLine: string): ParsedWeighingData | null {
  const cleaned = rawLine.trim();
  if (!cleaned) return null;

  const parts = cleaned.split(",");
  if (parts.length !== 4) {
    console.warn(`[asciiParser] Format tidak dikenali: "${rawLine}"`);
    return null;
  }

  const [statusRaw, typeRaw, valueRaw, unitRaw] = parts;
  const status = statusRaw === "ST" ? "STABLE" : statusRaw === "US" ? "UNSTABLE" : null;
  const weightType = typeRaw === "GS" ? "GROSS" : typeRaw === "NT" ? "NET" : null;
  const value = parseFloat(valueRaw);

  if (!status || !weightType || isNaN(value)) {
    console.warn(`[asciiParser] Gagal parse field: "${rawLine}"`);
    return null;
  }

  return {
    status,
    weightType,
    value,
    unit: unitRaw.trim(),
    rawPayload: cleaned,
    timestamp: new Date(),
  };
}

/**
 * Entry point baru: terima hex string dari file raw log,
 * decode ke ASCII, baru parse ke JSON.
 */
export function parseWeighingFromHex(hexLine: string): ParsedWeighingData | null {
  try {
    const asciiDecoded = hexToAscii(hexLine.trim());
    return parseWeighingAscii(asciiDecoded);
  } catch (err) {
    console.warn(`[asciiParser] Gagal decode hex: "${hexLine}"`, err);
    return null;
  }
}