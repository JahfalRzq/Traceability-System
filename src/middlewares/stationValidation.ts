import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/database";
import { Station } from "../entities/Station";

const stationRepo = AppDataSource.getRepository(Station);

/**
 * Level 1: cuma pastikan station valid & aktif, tempel ke req.station.
 * Dipakai untuk push-reading & live-reading (tidak butuh cek stage di body).
 */
export async function identifyStation(req: Request, res: Response, next: NextFunction) {
  try {
    const stationCode = req.header("x-station-id");

    if (!stationCode) {
      return res.status(401).json({ error: "Header x-station-id wajib diisi" });
    }

    const station = await stationRepo.findOneBy({ stationCode });

    if (!station) {
      return res.status(403).json({ error: `Station "${stationCode}" tidak terdaftar` });
    }

    if (!station.isActive) {
      return res.status(403).json({ error: `Station "${stationCode}" sedang nonaktif` });
    }

    (req as any).station = station;
    next();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Level 2: identifyStation + pastikan stage di body cocok dengan assignedStage.
 * Dipakai untuk scan & submit.
 */
export async function validateStationStage(req: Request, res: Response, next: NextFunction) {
  await identifyStation(req, res, () => {
    const station = (req as any).station as Station;
    const requestedStage = req.body?.stage;

    if (requestedStage && station.assignedStage !== requestedStage) {
      return res.status(403).json({
        error: `Station "${station.stationCode}" tidak diizinkan untuk stage "${requestedStage}" (assigned: ${station.assignedStage})`,
      });
    }

    next();
  });
}