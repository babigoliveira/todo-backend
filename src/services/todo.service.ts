import { sql } from "../db/db";
import type { ToDo } from "../db/db";

export type CreateTodoInput = {
  userId: string;
  task: string;
  flag: "high" | "medium" | "low";
};

export type UpdateTodoInput = {
  todoId: string;
  userId: string;
  task?: string;
  done?: boolean;
  flag?: "high" | "medium" | "low";
};

export const getTodoById = async ({ todoId, userId }: { todoId: string; userId: string }) => {
  const [todo] = await sql`
    SELECT id, task, done, flag
    FROM tasks
    WHERE id = ${todoId} AND user_id = ${userId}
  `;
  return todo;
};

export const listTodos = async (userId: string): Promise<ToDo[]> => {
  return await sql`
    SELECT id, task, done, flag
    FROM tasks
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
};

export const createTodo = async ({ userId, task, flag }: CreateTodoInput) => {
  const cleanTask = task.trim();
  if (!cleanTask) throw new Error("TASK_REQUIRED");

  if (!["high", "medium", "low"].includes(flag)) {
    throw new Error("FLAG_INVALID");
  }

  const [existing] = await sql`
    SELECT id
    FROM tasks
    WHERE user_id = ${userId} AND task = ${cleanTask}
  `;
  if (existing) throw new Error("TASK_DUPLICATE");

  const [todo] = await sql`
    INSERT INTO tasks (task, flag, user_id)
    VALUES (${cleanTask}, ${flag}, ${userId})
    RETURNING id, task, done, flag
  `;

  return todo;
};

export const updateTodo = async ({ todoId, userId, task, done, flag }: UpdateTodoInput) => {
  if (flag && !["high", "medium", "low"].includes(flag)) {
    throw new Error("FLAG_INVALID");
  }

  const [todo] = await sql`
    UPDATE tasks
    SET
      task = COALESCE(${task}, task),
      done = COALESCE(${done}, done),
      flag = COALESCE(${flag}, flag)
    WHERE id = ${todoId} AND user_id = ${userId}
    RETURNING id, task, done, flag
  `;

  return todo;
};

export const deleteTodo = async ({ todoId, userId }: { todoId: string; userId: string }) => {
  const result = await sql`
    DELETE FROM tasks
    WHERE id = ${todoId} AND user_id = ${userId}
  `;

  return result.count > 0;
};
