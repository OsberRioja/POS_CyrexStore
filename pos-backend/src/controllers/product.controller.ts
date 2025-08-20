import { Request, Response } from "express";
import { ProductService } from "../services/product.service";

export const ProductController = {
  async create(req: Request, res: Response) {
    try {
      const created = await ProductService.createProduct(req.body);
      return res.status(201).json(created);
    } catch (err: any) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || "Internal Error" });
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
