import type { Request, Response } from "express";
import * as authService from "../services/auth.service";

export const register = async (req: Request, res: Response) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    res.status(400).json({ message: "Dados obrigatórios ausentes" });
    return;
  }

  try {
    const user = await authService.registerUser({
      full_name,
      email,
      password
    });
    res.status(201).json({ user });
  } catch (e: any) {
    if (String(e?.message).includes("duplicate")) {
      res.status(409).json({ message: "Email já cadastrado" });
      return;
    }
    res.status(500).json({ message: "Erro ao criar usuário" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const result = await authService.loginUser({ email, password });

    res
      .cookie("todo_token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60
      })
      .json(result);
  } catch {
    res.status(401).json({ message: "Credenciais inválidas" });
  }
};

export const logout = (_: Request, res: Response) => {
  res.clearCookie("todo_token").status(204).send();
};
