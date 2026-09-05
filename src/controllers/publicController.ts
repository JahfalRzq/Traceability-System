import { Request, Response } from "express";
import { getDashboardRecords, getPublishedRecords } from "../services/publicDataService";

export async function dashboardHandler(req: Request, res: Response) {
  try {
    const { page, limit, stage, fromDate, toDate } = req.query;
    const result = await getDashboardRecords({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      stage: stage as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function publicWebHandler(req: Request, res: Response) {
  try {
    const { page, limit, fromDate, toDate } = req.query;
    const result = await getPublishedRecords({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      fromDate: fromDate as string,
      toDate: toDate as string,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}