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
