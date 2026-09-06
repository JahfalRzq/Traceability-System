import { Request, Response } from "express";
import { login } from "../services/authService";

export async function loginHandler(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "username dan password wajib diisi" });
    }
    const result = await login(username, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
}