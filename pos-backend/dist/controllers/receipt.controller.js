"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadComprobante = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ruta absoluta a la carpeta
const uploadDir = path_1.default.join(__dirname, '../../public/receipts');
// Asegurar que exista la carpeta
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const uploadComprobante = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se recibió archivo' });
        }
        const fileName = req.file.filename;
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const fileUrl = `${baseUrl}/receipts/${fileName}`;
        return res.json({
            message: 'Archivo guardado correctamente',
            pdfUrl: fileUrl,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al guardar archivo' });
    }
};
exports.uploadComprobante = uploadComprobante;
