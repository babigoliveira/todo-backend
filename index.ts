import express from 'express'
import { randomUUIDv7 } from "bun"

const app = express()

app.use(express.json())

type ToDo = { id: string, task: string, done: boolean }

let todoList: ToDo[] = []

app.get('/todo', (req, res) => {
    res.send(todoList)
})

app.get('/todo/:todoId', (req, res) => {
    const todoId = req.params.todoId

    const todo = todoList.find(todo => todo.id === todoId)

    if (!todo) {
        res.status(404).send({ error: `Não existe um toDo com o 'id ${todoId}'` })
        return
    }

    res.send(todo)
})

app.post('/todo', (req, res) => {
    const task = req.body.task

    const existingTask = todoList.find(todo => todo.task === task)

    if (existingTask) {
        res.status(409).send({ error: `Já existe uma tarefa criada igual a '${task}'` })
        return
    }

    todoList.push({
        id: randomUUIDv7().toString(),
        done: false,
        task: req.body.task
    })

    res.status(201).send(todoList.at(-1))
})

app.patch('/todo/:todoId',(req, res) => {
    const todoId = req.params.todoId
    const done = req.body.done

    const todo = todoList.find(todo => todo.id === todoId)

    if (!todo) {
        res.status(404).send({ error: `Não existe um toDo com o 'id ${todoId}'` })
        return
    }

    todo.done = done
    res.send(todo)
})

app.delete('/todo/:todoId', (req, res) => {
    const todoId = req.params.todoId

    const indexOfToDo = todoList.findIndex(todo => todo.id === todoId)

    if (indexOfToDo === -1) {
        res.status(404).send({ error: `Não existe um toDo com o 'id ${indexOfToDo}'` })
        return
    }

    todoList.splice(indexOfToDo, 1)

    res.status(204).send()
})

const port = 33333

app.listen(port, () => {
    console.log(`App de exemplo esta rodando na porta ${port}`)
})

export { app }
