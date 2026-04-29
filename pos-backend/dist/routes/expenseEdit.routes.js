"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const expenseEdit_controller_1 = require("../controllers/expenseEdit.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.put('/:id', auth_middleware_1.authMiddleware, expenseEdit_controller_1.ExpenseEditController.update);
exports.default = router;
