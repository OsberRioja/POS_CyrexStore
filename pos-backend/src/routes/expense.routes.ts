import { Router } from "express";
import { ExpenseController } from "../controllers/expense.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", authMiddleware, ExpenseController.create);
router.get("/", authMiddleware, ExpenseController.listAll); // list all or use ?boxId=
router.get("/by-box", authMiddleware, ExpenseController.listByBox); // /api/expenses/by-box?boxId=1
router.get("/:id", authMiddleware, ExpenseController.getById);

export default router;
