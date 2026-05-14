import { Request, Response } from "express";
import { productService } from "../services/product.service";

export const productController = {
  sanitizeCostPriceByRole(data: any, role?: string) {
    if (role === "ADMIN") return data;

    const sanitizeProduct = (product: any) => {
      if (!product || typeof product !== "object") return product;
      const { costPrice: _costPrice, ...rest } = product;
      return rest;
    };

    if (Array.isArray(data)) {
      return data.map(sanitizeProduct);
    }

    return sanitizeProduct(data);
  },

  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).userId ?? (req as any).user?.sub ?? (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: "Usuario no autenticado" });

      const dto = req.body;
      const created = await productService.createProduct(dto, String(userId));
      const userRole = (req as any).user?.role as string | undefined;
      return res.status(201).json(productController.sanitizeCostPriceByRole(created, userRole));
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
          (p.sku || "").toLowerCase().includes(searchTerm) || (p.codigoInterno || "").toLowerCase().includes(searchTerm)
        );
      }
      
      const userRole = (req as any).user?.role as string | undefined;
      res.json(productController.sanitizeCostPriceByRole(products, userRole));
    } catch (error: any) {
      console.error("GET /products error:", error);
      res.status(500).json({ error: error?.message || "Error interno" });
    }
  },

  async getGlobalStock(req: Request, res: Response) {
    try {
      const validSortBy = ["name", "sku", "codigoInterno", "category", "brand", "totalStock"] as const;
      const validSortDir = ["asc", "desc"] as const;
      const sortBy = validSortBy.includes(req.query.sortBy as any)
        ? (req.query.sortBy as typeof validSortBy[number])
        : undefined;
      const sortDir = validSortDir.includes(req.query.sortDir as any)
        ? (req.query.sortDir as typeof validSortDir[number])
        : undefined;

      const response = await productService.getGlobalStock({
        q: req.query.q?.toString(),
        category: req.query.category?.toString(),
        brand: req.query.brand?.toString(),
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sortBy,
        sortDir
      });

      res.json(response);
    } catch (error: any) {
      console.error("GET /products/global-stock error:", error);
      res.status(error?.status || 500).json({ error: error?.message || "Error interno" });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const product = await productService.getProductById(req.params.id);
      const userRole = (req as any).user?.role as string | undefined;
      res.json(productController.sanitizeCostPriceByRole(product, userRole));
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },

  async getMetadata(req: Request, res: Response) {
    try {
      const userBranchId = (req as any).user?.branchId;
      const targetBranchId = userBranchId ?? (req.query.branchId ? Number(req.query.branchId) : undefined);
      const metadata = await productService.getProductMetadata(targetBranchId);
      res.json(metadata);
    } catch (error: any) {
      console.error("GET /products/metadata error:", error);
      res.status(500).json({ error: error?.message || "Error interno" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      const userRole = (req as any).user?.role as string | undefined;
      res.json(productController.sanitizeCostPriceByRole(product, userRole));
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

  async getNextCodigoInterno(req: Request, res: Response) {
    try {
      const codigoInterno = await productService.getNextCodigoInterno();

      return res.json({
        codigoInterno
      });
    } catch (error: any) {
      console.error("Error obteniendo siguiente código interno:", error);

      return res.status(500).json({
        error: "Error obteniendo siguiente código interno"
      });
    }
  },
};
