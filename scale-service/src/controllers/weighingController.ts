import { Request, Response } from "express";
import {
  startWeighingSession,
  submitWeighing,
  approveWeighing,
  rejectWeighing,
  getLatestReading,
  updateLatestReading,
} from "../services/weighingService";
import { CurrentStage } from "../entities/WeighingRecord";
import { Station } from "../entities/Station";

export async function scanHandler(req: Request, res: Response) {
  try {
    const { deliveryBarcode, stage } = req.body;
    if (!deliveryBarcode || !stage) {
      return res.status(400).json({ error: "deliveryBarcode dan stage wajib diisi" });
    }
    const record = await startWeighingSession(deliveryBarcode, stage as CurrentStage);
    res.json(record);
  } catch (err: any) {
    if (err.message.startsWith("Validasi gagal")) {
      return res.status(422).json({ error: err.message }); // 422 = data tidak lolos validasi bisnis
    }
    res.status(500).json({ error: err.message });
  }
}
// Dipanggil oleh EDGE (mini PC) tiap kali ada pembacaan baru dari serial
export function pushReadingHandler(req: Request, res: Response) {
  const station = (req as any).station as Station;
  const { status, weightType, value, unit, rawPayload, timestamp, cctvSnapshotUrl } = req.body;

  console.log(`[central] Menerima push dari station "${station.stationCode}":`, req.body); // ← tambah ini

  if (!status || value === undefined) {
    return res.status(400).json({ error: "Data reading tidak lengkap" });
  }

  updateLatestReading(station.stationCode, {
    status,
    weightType,
    value,
    unit,
    rawPayload,
    timestamp: new Date(timestamp),
    cctvSnapshotUrl: cctvSnapshotUrl || null, // baru
  });

  console.log(`[central] Reading tersimpan di buffer untuk "${station.stationCode}"`); // ← tambah ini juga

  res.json({ received: true, stationCode: station.stationCode });
}

// Dipanggil oleh UI operator (polling) buat lihat nilai terkini di station-nya
export function liveReadingHandler(req: Request, res: Response) {
  const station = (req as any).station as Station;
  const reading = getLatestReading(station.stationCode);
  res.json({ reading });
}

export async function submitHandler(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { stage, operatorName } = req.body;
    const station = (req as any).station as Station;
    const record = await submitWeighing(id, stage as CurrentStage, operatorName, station.stationCode);
    res.json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function approveHandler(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { stage, approverName } = req.body;
    const record = await approveWeighing(id, stage as CurrentStage, approverName);
    res.json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function rejectHandler(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { stage, approverName, reason } = req.body;
    const record = await rejectWeighing(id, stage as CurrentStage, approverName, reason);
    res.json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}