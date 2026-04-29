"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const receipt_controller_1 = require("../controllers/receipt.controller");
const router = express_1.default.Router();
// Configuración de almacenamiento
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/receipts');
    },
    filename: (req, file, cb) => {
        const originalName = file.originalname || 'comprobante.pdf';
        const uniqueName = `${Date.now()}-${originalName}`;
        cb(null, uniqueName);
    },
});
const upload = (0, multer_1.default)({ storage });
// 👇 aquí multer ya inyecta req.file correctamente
router.post('/upload', upload.single('file'), receipt_controller_1.uploadComprobante);
exports.default = router;
