import { Request, Response } from "express";
import { ProductService } from "../services/product.service";
import { CreateProductDTO } from "../dtos/createProduct.dto";
import { authMiddleware } from "../middlewares/auth.middleware";

export const ProductController = {
  async create(req: Request, res: Response) {
  try {
    const dto: CreateProductDTO = req.body;
    const userId = req.userId; // ✅ ahora sí existe
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const product = await ProductService.createProduct(dto, userId);
    res.json(product);
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message });
  }
},

  async list(req: Request, res: Response) {
    try {
      const products = await ProductService.listProducts();
      return res.json(products);
    } catch (err: any) {
      return res.status(500).json({ error: "Error al listar productos" });
    }
  },

  async getOne(req: Request, res: Response) {
    try {
      const product = await ProductService.getProductById(req.params.id);
      return res.json(product);
    } catch (err: any) {
      return res.status(err.status || 500).json({ error: err.message || "Error interno" });
    }
  }
};
