import type { Request, Response } from "express";
import * as userService from "../services/user.service";

export const userProfile = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await userService.getUserProfile(userId);

  if (!user) {
    res.status(404).json({ message: "Usuário não encontrado" });
    return;
  }

  res.json(user);
};

export const updateUserProfile = async (req: Request, res: Response) => {
  const { full_name } = req.body;

  try {
    const user = await userService.updateProfile({
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

export const updateUserPassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  try {
    await userService.updatePassword({
      userId: req.user!.id,
      currentPassword,
      newPassword
    });

    res.status(204).send();
  } catch (e: any) {
    debugger;
    console.log(e);
    if (e.message === "PASSWORD_REQUIRED") {
      res.status(400).json({ message: "Senha obrigatória" });
      return;
    }

    if (e.message === "PASSWORD_TOO_SHORT") {
      res.status(400).json({
        message: "A nova senha deve ter no mínimo 6 caracteres"
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
