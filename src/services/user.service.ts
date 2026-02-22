import bcrypt from "bcryptjs";
import { sql } from "../db/db";

export type UpdateProfileInput = {
  userId: string;
  full_name: string;
};

export type UpdatePasswordInput = {
  userId: string;
  currentPassword: string;
  newPassword: string;
};

export const getUserProfile = async (userId: string) => {
  const [user] = await sql`
    SELECT id, full_name, email, role
    FROM users
    WHERE id = ${userId}
  `;
  return user;
};

export const updateProfile = async ({ userId, full_name: full_name }: UpdateProfileInput) => {
  const cleanName = full_name.trim();

  if (!cleanName) {
    throw new Error("NAME_REQUIRED");
  }

  const [user] = await sql`
    UPDATE users
    SET full_name = ${cleanName}
    WHERE id = ${userId}
    RETURNING id, full_name, email, role
  `;

  return user;
};

export const updatePassword = async ({ userId, currentPassword, newPassword }: UpdatePasswordInput) => {
  if (!currentPassword || !newPassword) {
    throw new Error("PASSWORD_REQUIRED");
  }

  if (newPassword.length < 6) {
    throw new Error("PASSWORD_TOO_SHORT");
  }

  const [user] = await sql`
    SELECT password_hash
    FROM users
    WHERE id = ${userId}
  `;

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const valid = await bcrypt.compare(currentPassword, user.password_hash);

  if (!valid) {
    throw new Error("INVALID_CURRENT_PASSWORD");
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  debugger;

  await sql`
    UPDATE users
    SET password_hash = ${newHash}
    WHERE id = ${userId}
  `;

  return true;
};
