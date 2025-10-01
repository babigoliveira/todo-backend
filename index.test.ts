import { describe, it, expect, beforeEach, afterEach, beforeAll } from "bun:test";
import { app } from "./index";

let server: any;
let baseUrl: string;
let headers: Record<string, string>;

beforeEach(async () => {
  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://localhost:${port}`;
  const response = await fetch(`${baseUrl}/auth/token`, { method: "POST" });
  const { token } = await response.json();
  headers = { Authorization: `Bearer ${token}` };
});

afterEach(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
    console.log("Servidor fechado com sucesso.");
  }
});

describe("ToDo API test", () => {
  let todoId: string;

  it("should return all fetch todo", async () => {
    const response = await fetch(`${baseUrl}/todo`, { headers });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it("should fetch a single todo by id", async () => {
    const postResponse = await fetch(`${baseUrl}/todo`, {
      method: "POST",
      headers: {
        ...headers,
        ...{ "Content-Type": "application/json" }
      },
      body: JSON.stringify({ task: "Test Task" })
    });
    const postData = await postResponse.json();
    todoId = postData.id;

    const getResponse = await fetch(`${baseUrl}/todo/${todoId}`, { headers });
    const todo = await getResponse.json();

    expect(getResponse.status).toBe(200);
    expect(todo.id).toBe(todoId);
    expect(todo.task).toBe("Test Task");
  });

  it("should return 404 when todo not found", async () => {
    const invalidTodoId = "-1";
    const response = await fetch(`${baseUrl}/todo/${invalidTodoId}`, { headers });
    const error = await response.json();

    expect(response.status).toBe(404);
    expect(error.error).toBe(`Não existe um toDo com o 'id ${invalidTodoId}'`);
  });

  it("should create a new todo", async () => {
    const response = await fetch(`${baseUrl}/todo`, {
      method: "POST",
      headers: {
        ...headers,
        ...{ "Content-Type": "application/json" }
      },
      body: JSON.stringify({ task: "New Task" })
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.task).toBe("New Task");
    expect(data.done).toBe(false);
  });

  it("should return 409 if task already exists", async () => {
    const response = await fetch(`${baseUrl}/todo`, {
      method: "POST",
      headers: {
        ...headers,
        ...{ "Content-Type": "application/json" }
      },
      body: JSON.stringify({ task: "New Task" })
    });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe(`Já existe uma tarefa criada igual a 'New Task'`);
  });

  it("should update todo status", async () => {
    const response = await fetch(`${baseUrl}/todo/${todoId}`, {
      method: "PATCH",
      headers: {
        ...headers,
        ...{ "Content-Type": "application/json" }
      },
      body: JSON.stringify({ done: true })
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.done).toBe(true);
  });

  it("should delete a todo", async () => {
    const response = await fetch(`${baseUrl}/todo/${todoId}`, {
      method: "DELETE",
      headers
    });
    expect(response.status).toBe(204);

    const getResponse = await fetch(`${baseUrl}/todo/${todoId}`, { headers });
    expect(getResponse.status).toBe(404);
  });

  it("should return 404 when trying to delete non-existent todo", async () => {
    const invalidTodoId = "-1";
    const response = await fetch(`${baseUrl}/todo/${invalidTodoId}`, {
      method: "DELETE",
      headers
    });
    const error = await response.json();

    expect(response.status).toBe(404);
    expect(error.error).toBe(`Não existe um toDo com o 'id ${invalidTodoId}'`);
  });
});
