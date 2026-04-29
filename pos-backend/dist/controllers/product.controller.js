"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productController = void 0;
const product_service_1 = require("../services/product.service");
exports.productController = {
    sanitizeCostPriceByRole(data, role) {
        if (role === "ADMIN")
            return data;
        const sanitizeProduct = (product) => {
            if (!product || typeof product !== "object")
                return product;
            const { costPrice: _costPrice, ...rest } = product;
            return rest;
        };
        if (Array.isArray(data)) {
            return data.map(sanitizeProduct);
        }
        return sanitizeProduct(data);
    },
    async create(req, res) {
        try {
            const userId = req.userId ?? req.user?.sub ?? req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Usuario no autenticado" });
            const dto = req.body;
            const created = await product_service_1.productService.createProduct(dto, String(userId));
            const userRole = req.user?.role;
            return res.status(201).json(exports.productController.sanitizeCostPriceByRole(created, userRole));
        }
        catch (err) {
            console.error("POST /products error:", err);
            return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    async getAll(req, res) {
        try {
            const { q, onlyActive, onlyInStock } = req.query;
            // Obtener branchId del usuario autenticado
            const userBranchId = req.user?.branchId;
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
                products = await product_service_1.productService.getProducts(targetBranchId, filterOnlyInStock);
            }
            else {
                products = await product_service_1.productService.getAllProducts(true, targetBranchId, filterOnlyInStock);
            }
            // Si hay query de búsqueda, filtrar adicionalmente
            if (q) {
                const searchTerm = q.toString().toLowerCase();
                products = products.filter((p) => p.name.toLowerCase().includes(searchTerm) ||
                    (p.sku || "").toLowerCase().includes(searchTerm) || (p.codigoInterno || "").toLowerCase().includes(searchTerm));
            }
            const userRole = req.user?.role;
            res.json(exports.productController.sanitizeCostPriceByRole(products, userRole));
        }
        catch (error) {
            console.error("GET /products error:", error);
            res.status(500).json({ error: error?.message || "Error interno" });
        }
    },
    async getById(req, res) {
        try {
            const product = await product_service_1.productService.getProductById(req.params.id);
            const userRole = req.user?.role;
            res.json(exports.productController.sanitizeCostPriceByRole(product, userRole));
        }
        catch (error) {
            res.status(404).json({ error: error.message });
        }
    },
    async getMetadata(req, res) {
        try {
            const userBranchId = req.user?.branchId;
            const targetBranchId = userBranchId ?? (req.query.branchId ? Number(req.query.branchId) : undefined);
            const metadata = await product_service_1.productService.getProductMetadata(targetBranchId);
            res.json(metadata);
        }
        catch (error) {
            console.error("GET /products/metadata error:", error);
            res.status(500).json({ error: error?.message || "Error interno" });
        }
    },
    async update(req, res) {
        try {
            const product = await product_service_1.productService.updateProduct(req.params.id, req.body);
            const userRole = req.user?.role;
            res.json(exports.productController.sanitizeCostPriceByRole(product, userRole));
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
    async delete(req, res) {
        try {
            await product_service_1.productService.deleteProduct(req.params.id);
            res.json({ message: "Producto eliminado" });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
    async deactivate(req, res) {
        try {
            const userId = req.userId ?? req.user?.sub ?? req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Usuario no autenticado" });
            const product = await product_service_1.productService.deactivateProduct(req.params.id, userId);
            res.json({ message: "Producto desactivado", product });
        }
        catch (error) {
            console.error("PATCH /products/:id/deactivate error:", error);
            res.status(error?.status || 400).json({ error: error?.message || "Error al desactivar producto" });
        }
    },
    async activate(req, res) {
        try {
            const userId = req.userId ?? req.user?.sub ?? req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Usuario no autenticado" });
            const product = await product_service_1.productService.activateProduct(req.params.id, userId);
            res.json({ message: "Producto activado", product });
        }
        catch (error) {
            console.error("PATCH /products/:id/activate error:", error);
            res.status(error?.status || 400).json({ error: error?.message || "Error al activar producto" });
        }
    },
};
