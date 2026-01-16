import { SQL } from "bun";

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

if (!DB_HOST) {
  throw new Error("Variáveis de ambiente do banco não definidas");
}

export const sql = new SQL(`postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);

export interface User {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: "admin" | "user";
  created_at: Date;
}

export interface ToDo {
  id: string;
  user_id: string;
  task: string;
  done: boolean;
  flag: "high" | "medium" | "low";
  created_at: Date;
}

await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;

await sql`
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('admin','user')),
  created_at TIMESTAMP DEFAULT NOW()
)
`;

await sql`
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  flag VARCHAR(10) CHECK (flag IN ('high','medium','low')),
  created_at TIMESTAMP DEFAULT NOW()
)
`;

