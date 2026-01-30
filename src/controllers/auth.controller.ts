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

export const me = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await authService.getMe(userId);

  if (!user) {
    res.status(404).json({ message: "Usuário não encontrado" });
    return;
  }

  res.json(user);
};

export const logout = (_: Request, res: Response) => {
  res.clearCookie("todo_token").status(204).send();
};

export const updateProfile = async (req: Request, res: Response) => {
  const { full_name } = req.body;

  try {
    const user = await authService.updateProfile({
      userId: req.user!.id,
      full_name
    });

    res.json(user);
  } catch (e: any) {
    if (e.message === "NAME_REQUIRED") {
      res.status(400).json({ message: "Nome é obrigatório" });
      return;
    }

    res.status(500).json({ message: "Erro ao atualizar perfil" });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  try {
    await authService.updatePassword({
      userId: req.user!.id,
      currentPassword,
      newPassword
    });

    res.status(204).send();
  } catch (e: any) {
    if (e.message === "PASSWORD_REQUIRED") {
      res.status(400).json({ message: "Senha obrigatória" });
      return;
    }

    if (e.message === "PASSWORD_TOO_SHORT") {
      res.status(400).json({
        message: "A nova senha deve ter no mínimo 8 caracteres"
      });
      return;
    }

    if (e.message === "INVALID_CURRENT_PASSWORD") {
      res.status(401).json({
        message: "Senha atual incorreta"
      });
      return;
    }

    res.status(500).json({ message: "Erro ao alterar senha" });
  }
};
