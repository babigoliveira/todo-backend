import { Router } from "express";
import { authenticateToken } from "../middleware/authenticateToken";
import * as todoController from "../controllers/todo.controller";

const router = Router();

router.get("/", authenticateToken, todoController.list);
router.post("/", authenticateToken, todoController.create);
router.get("/:todoId", authenticateToken, todoController.getById);
router.patch("/:todoId", authenticateToken, todoController.update);
router.delete("/:todoId", authenticateToken, todoController.remove);

export default router;
