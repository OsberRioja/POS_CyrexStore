"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const expense_controller_1 = require("../controllers/expense.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post("/", auth_middleware_1.authMiddleware, expense_controller_1.ExpenseController.create);
router.get("/", auth_middleware_1.authMiddleware, expense_controller_1.ExpenseController.listAll); // list all or use ?boxId=
router.get("/by-box", auth_middleware_1.authMiddleware, expense_controller_1.ExpenseController.listByBox); // /api/expenses/by-box?boxId=1
router.get("/:id", auth_middleware_1.authMiddleware, expense_controller_1.ExpenseController.getById);
exports.default = router;
