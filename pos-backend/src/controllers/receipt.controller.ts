import { Request, Response } from 'express';
import { Express } from 'express-serve-static-core';
import path from 'path';
import fs from 'fs';

// Ruta absoluta a la carpeta
const uploadDir = path.join(__dirname, '../../public/receipts');

// Asegurar que exista la carpeta
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const uploadComprobante = (req: MulterRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió archivo' });
    }

    const fileName = req.file.filename;

    const fileUrl = `http://localhost:3000/receipts/${fileName}`;

    return res.json({
      message: 'Archivo guardado correctamente',
      pdfUrl: fileUrl,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al guardar archivo' });
  }
};