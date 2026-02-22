import { Router } from "express";
import { authenticateToken } from "../middleware/authenticateToken";
import * as userController from "../controllers/user.controller";

const router = Router();

router.get("/", authenticateToken, userController.userProfile);
router.patch("/", authenticateToken, userController.updateUserProfile);
router.patch("/password", authenticateToken, userController.updateUserPassword);

export default router;
