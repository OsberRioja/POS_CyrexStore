"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const saleEdit_controller_1 = require("../controllers/saleEdit.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.put('/:id', auth_middleware_1.authMiddleware, saleEdit_controller_1.SaleEditController.update);
exports.default = router;
