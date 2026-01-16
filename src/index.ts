import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sql } from "./db/db";
import type { ToDo } from "./db/db";
import { authenticateToken } from "./middleware/authenticateToken";

const app = express();
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) throw new Error("JWT_SECRET não está definido no .env");

app.post("/auth/register", async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    res.status(400).json({ message: "Dados obrigatórios ausentes" });
    return;
  }

  const password_hash = await bcrypt.hash(password, 10);

  try {
    const [user] = await sql`
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES (${full_name}, ${email}, ${password_hash}, 'user')
      RETURNING id, full_name, email, role
    `;

    res.status(201).json({ user });
    return;
  } catch (e: any) {
    if (
      String(e?.message || "")
        .toLowerCase()
        .includes("duplicate")
    ) {
      res.status(409).json({ message: "Email já cadastrado" });
      return;
    }
    res.status(500).json({ message: "Erro ao criar usuário" });
    return;
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const [user] = await sql`
    SELECT id, full_name, password_hash
    FROM users
    WHERE email = ${email}
  `;

  if (!user) {
    res.status(401).json({ message: "Credenciais inválidas" });
    return;
  }

  const passwordValid = await bcrypt.compare(password, user.password_hash);

  if (!passwordValid) {
    res.status(401).json({ message: "Senha inválida" });
    return;
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });

  res
    .cookie("todo_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60
    })
    .json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name
      }
    });
  return;
});

app.get("/auth/me", authenticateToken, async (req, res) => {
  const userId = req.user!.id;

  const [user] = await sql`
    SELECT id, full_name, email, role
    FROM users
    WHERE id = ${userId}
  `;

  if (!user) {
    res.status(404).json({ message: "Usuário não encontrado" });
    return;
  }

  res.json(user);
});

app.post("/auth/logout", (req, res) => {
  res.clearCookie("todo_token").status(204).send();
});

app.get("/todo", authenticateToken, async (req, res) => {
  const userId = req.user!.id;

  const todos: ToDo[] = await sql`
    SELECT id, task, done, flag
    FROM tasks
    WHERE user_id = ${req.user.id}
    ORDER BY created_at DESC
  `;

  res.send(todos);
});

app.get("/todo/:todoId", authenticateToken, async (req, res) => {
  const { todoId } = req.params;
  const userId = req.user!.id;

  const [todo] = await sql`
    SELECT id, task, done, flag
    FROM tasks
    WHERE id = ${todoId} AND user_id = ${req.user.id}
  `;

  if (!todo) {
    res.status(404).send({ error: `Não existe um toDo com o 'id ${todoId}'` });
    return;
  }

  res.send(todo);
});

app.post("/todo", authenticateToken, async (req, res) => {
  const { task, flag } = req.body;
  const userId = req.user!.id;

  if (!flag || !["high", "medium", "low"].includes(flag)) {
    res.status(400).send({ error: "Flag inválida" });
    return;
  }

  const [existingTask] = await sql`
    SELECT id
    FROM tasks
    WHERE task = ${task}
`;

  if (existingTask) {
    res.status(409).send({ error: `Já existe uma tarefa criada igual a '${task}'` });
    return;
  }

  const [todo] = await sql`
  INSERT INTO tasks (task, flag, user_id)
  VALUES (${task}, ${flag}, ${req.user.id})
  RETURNING id, task, done, flag
  `;

  res.status(201).send(todo);
});

app.patch("/todo/:todoId", authenticateToken, async (req, res) => {
  const { todoId } = req.params;
  const { task, done, flag } = req.body;
  const userId = req.user!.id;

  if (flag && !["high", "medium", "low"].includes(flag)) {
    res.status(400).send({ error: "Flag inválida" });
    return;
  }

  const [todo] = await sql`
    UPDATE tasks
    SET
      task = COALESCE(${task}, task),
      done = COALESCE(${done}, done),
      flag = COALESCE(${flag}, flag)
    WHERE id = ${todoId} AND user_id = ${req.user.id}
    RETURNING id, task, done, flag
  `;

  if (!todo) {
    res.status(404).send({ error: `Não existe um toDo com o 'id ${todoId}'` });
    return;
  }

  res.send(todo);
});

app.delete("/todo/:todoId", authenticateToken, async (req, res) => {
  const { todoId } = req.params;
  const userId = req.user!.id;

  const result = await sql`
    DELETE FROM tasks
    WHERE id = ${todoId} AND user_id = ${req.user.id}
  `;

  if (result.count === 0) {
    res.status(404).send({ error: `Não existe um toDo com o 'id ${todoId}'` });
    return;
  }

  res.status(204).send();
});

const port = Number(process.env.PORT) || 33333;

app.listen(port, () => {
  console.log(`🚀 API rodando na porta ${port}`);
});

export { app };
