import type { Request, Response } from "express";
import * as todoService from "../services/todo.service";

export const list = async (req: Request, res: Response) => {
  const todos = await todoService.listTodos(req.user!.id);
  res.json(todos);
};

export const getById = async (req: Request, res: Response) => {
  const { todoId } = req.params;

  const todo = await todoService.getTodoById({
    todoId,
    userId: req.user!.id
  });

  if (!todo) {
    res.status(404).json({ message: "Tarefa não encontrada" });
    return;
  }

  res.json(todo);
};

export const create = async (req: Request, res: Response) => {
  const { task, flag } = req.body;

  try {
    const todo = await todoService.createTodo({
      userId: req.user!.id,
      task,
      flag
    });

    res.status(201).json(todo);
  } catch (e: any) {
    if (e.message === "TASK_REQUIRED") {
      res.status(400).json({ message: "Task é obrigatória" });
      return;
    }
    if (e.message === "TASK_DUPLICATE") {
      res.status(409).json({ message: "Task duplicada" });
      return;
    }
    if (e.message === "FLAG_INVALID") {
      res.status(400).json({ message: "Flag inválida" });
      return;
    }
    res.status(500).json({ message: "Erro ao criar tarefa" });
  }
};

export const update = async (req: Request, res: Response) => {
  const { todoId } = req.params;
  const { task, done, flag } = req.body;

  try {
    const todo = await todoService.updateTodo({
      todoId,
      userId: req.user!.id,
      task,
      done,
      flag
    });

    if (!todo) {
      res.status(404).json({ message: "Tarefa não encontrada" });
      return;
    }

    res.json(todo);
  } catch (e: any) {
    if (e.message === "FLAG_INVALID") {
      res.status(400).json({ message: "Flag inválida" });
      return;
    }
    res.status(500).json({ message: "Erro ao atualizar tarefa" });
  }
};

export const remove = async (req: Request, res: Response) => {
  const { todoId } = req.params;

  const deleted = await todoService.deleteTodo({
    todoId,
    userId: req.user!.id
  });

  if (!deleted) {
    res.status(404).json({ message: "Tarefa não encontrada" });
    return;
  }

  res.status(204).send();
};
