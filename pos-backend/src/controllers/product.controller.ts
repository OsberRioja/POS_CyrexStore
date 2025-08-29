import { Request, Response } from "express";
import { productService } from "../services/product.service";

export const productController = {
  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).userId ?? (req as any).user?.sub ?? (req as any).user?.id; // ID del usuario logueado desde middleware JWT
      if (!userId) return res.status(401).json({ error: "Usuario no autenticado" });

      const dto = req.body; // body validado por DTO idealmente
      const created = await productService.createProduct(dto, String(userId));
      return res.status(201).json(created);
    } catch (err: any) {
      console.error("POST /products error:", err);
      return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async getAll(req: Request, res: Response) {
    const products = await productService.getProducts();
    res.json(products);
  },

  async getById(req: Request, res: Response) {
    try {
      const product = await productService.getProductById(req.params.id);
      res.json(product);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      await productService.deleteProduct(req.params.id);
      res.json({ message: "Producto eliminado" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
};
