import express, { Request } from 'express';
import multer, { StorageEngine } from 'multer';
import { uploadComprobante } from '../controllers/receipt.controller';

const router = express.Router();

// Tipar correctamente req.body
interface MulterRequest extends Request {
  body: {
    saleId?: string;
  };
}

// Configuración de almacenamiento
const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/receipts');
  },
  filename: (req: MulterRequest, file, cb) => {
    const saleId = req.body.saleId || 'unknown';
    const uniqueName = `venta-${saleId}-${Date.now()}.pdf`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// 👇 aquí multer ya inyecta req.file correctamente
router.post('/upload', upload.single('file'), uploadComprobante);

export default router;