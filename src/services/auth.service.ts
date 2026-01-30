import bcrypt from "bcryptjs";
import { sql } from "../db/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) throw new Error("JWT_SECRET não está definido no .env");

export type RegisterUserInput = {
  full_name: string;
  email: string;
  password: string;
};

export type LoginUserInput = {
  email: string;
  password: string;
};

export type UpdateProfileInput = {
  userId: string;
  full_name: string;
};

export type UpdatePasswordInput = {
  userId: string;
  currentPassword: string;
  newPassword: string;
};

export const registerUser = async ({ full_name, email, password }: RegisterUserInput) => {
  const password_hash = await bcrypt.hash(password, 10);

  const [user] = await sql`
    INSERT INTO users (full_name, email, password_hash, role)
    VALUES (${full_name}, ${email}, ${password_hash}, 'user')
    RETURNING id, full_name, email, role
  `;

  return user;
};

export const loginUser = async ({ email, password }: LoginUserInput) => {
  const [user] = await sql`
    SELECT id, full_name, password_hash
    FROM users
    WHERE email = ${email}
  `;

  if (!user) throw new Error("INVALID_CREDENTIALS");

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error("INVALID_CREDENTIALS");

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: "1h"
  });

  return {
    token,
    user: {
      id: user.id,
      full_name: user.full_name
    }
  };
};

export const getMe = async (userId: string) => {
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

  if (newPassword.length < 8) {
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

  await sql`
    UPDATE users
    SET password_hash = ${newHash}
    WHERE id = ${userId}
  `;

  return true;
};
