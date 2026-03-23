import { Request, Response } from "express";
import { productService } from "../services/product.service";

export const productController = {
  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).userId ?? (req as any).user?.sub ?? (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: "Usuario no autenticado" });

      const dto = req.body;
      const created = await productService.createProduct(dto, String(userId));
      return res.status(201).json(created);
    } catch (err: any) {
      console.error("POST /products error:", err);
      return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const { q, onlyActive, onlyInStock } = req.query;
      
      // Obtener branchId del usuario autenticado
      const userBranchId = (req as any).user?.branchId;
      let targetBranchId = userBranchId;
      
      // Si es admin global, buscar branchId en query params
      if (!targetBranchId) {
        targetBranchId = req.query.branchId ? Number(req.query.branchId) : undefined;
        
        if (!targetBranchId) {
          return res.status(400).json({ 
            error: "Para usuarios administradores, debe especificar una sucursal via query param: ?branchId=1" 
          });
        }
      }

      let products;
      const filterOnlyInStock = onlyInStock === 'true';

      if (onlyActive === 'true') {
        products = await productService.getProducts(targetBranchId, filterOnlyInStock);
      } else {
        products = await productService.getAllProducts(true, targetBranchId, filterOnlyInStock);
      }
      
      // Si hay query de búsqueda, filtrar adicionalmente
      if (q) {
        const searchTerm = q.toString().toLowerCase();
        products = products.filter((p: any) =>
          p.name.toLowerCase().includes(searchTerm) ||
          p.sku.toLowerCase().includes(searchTerm)
        );
      }
      
      res.json(products);
    } catch (error: any) {
      console.error("GET /products error:", error);
      res.status(500).json({ error: error?.message || "Error interno" });
    }
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

   async deactivate(req: Request, res: Response) {
    try {
      const userId = (req as any).userId ?? (req as any).user?.sub ?? (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: "Usuario no autenticado" });

      const product = await productService.deactivateProduct(req.params.id, userId);
      res.json({ message: "Producto desactivado", product });
    } catch (error: any) {
      console.error("PATCH /products/:id/deactivate error:", error);
      res.status(error?.status || 400).json({ error: error?.message || "Error al desactivar producto" });
    }
  },

  async activate(req: Request, res: Response) {
    try {
      const userId = (req as any).userId ?? (req as any).user?.sub ?? (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: "Usuario no autenticado" });

      const product = await productService.activateProduct(req.params.id, userId);
      res.json({ message: "Producto activado", product });
    } catch (error: any) {
      console.error("PATCH /products/:id/activate error:", error);
      res.status(error?.status || 400).json({ error: error?.message || "Error al activar producto" });
    }
  },
};