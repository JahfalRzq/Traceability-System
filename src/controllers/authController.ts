import { Request, Response } from "express";
import { login } from "../services/authService";
import { LoginRequestBody, LoginResponseBody } from "../types/auth.types";

export async function loginHandler(req: Request, res: Response) {
  try {
    const { username, password } = req.body as LoginRequestBody;
    if (!username || !password) {
      return res.status(400).json({ error: "username dan password wajib diisi" });
    }

    const { token, user, roles } = await login(username, password);

    const response: LoginResponseBody = {
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        roles,
      },
    };

    res.json(response);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
}