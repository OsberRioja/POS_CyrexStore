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
  filename: (req, file, cb) => {
    const originalName = file.originalname || 'comprobante.pdf';
    const uniqueName = `${Date.now()}-${originalName}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// 👇 aquí multer ya inyecta req.file correctamente
router.post('/upload', upload.single('file'), uploadComprobante);

export default router;