"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = void 0;
const product_repository_1 = require("../repositories/product.repository");
const prismaClient_1 = require("../prismaClient");
const normalizeTextField_1 = require("../utils/normalizeTextField");
exports.productService = {
    async generateUniqueCodigoInterno(tx) {
        for (let i = 0; i < 20; i++) {
            const codigo = String(Math.floor(Math.random() * 10000000)).padStart(7, "0");
            const exists = await tx.product.findFirst({ where: { codigoInterno: codigo }, select: { id: true } });
            if (!exists)
                return codigo;
        }
        throw { status: 500, message: "No se pudo generar un código interno único" };
    },
    async createProduct(dto, userId) {
        // validaciones mínimas
        if (!dto.name || dto.salePrice == null || dto.costPrice == null) {
            throw { status: 400, message: "name, costPrice y salePrice son requeridos" };
        }
        const codigoInterno = dto.codigoInterno?.trim();
        if (!codigoInterno || !/^\d{7}$/.test(codigoInterno)) {
            throw { status: 400, message: "codigoInterno es requerido y debe tener exactamente 7 dígitos numéricos" };
        }
        // Validar moneda
        const validCurrencies = ['BOB', 'USD', 'CNY'];
        const priceCurrency = dto.priceCurrency?.toUpperCase() || 'BOB';
        if (!validCurrencies.includes(priceCurrency)) {
            throw { status: 400, message: "priceCurrency debe ser BOB, USD o CNY" };
        }
        // ✅ Crear producto maestro en todas las sucursales activas
        try {
            return prismaClient_1.prisma.$transaction(async (tx) => {
                const normalizedCategory = (0, normalizeTextField_1.normalizeTextField)(dto.category);
                const normalizedBrand = (0, normalizeTextField_1.normalizeTextField)(dto.brand);
                if (dto.sku?.trim()) {
                    const existingSku = await tx.product.findFirst({
                        where: {
                            sku: dto.sku.trim()
                        }
                    });
                    if (existingSku) {
                        throw { status: 400, message: `El SKU '${dto.sku}' ya existe.` };
                    }
                }
                const existingCodigoInterno = await tx.product.findFirst({
                    where: { codigoInterno }
                });
                if (existingCodigoInterno) {
                    throw { status: 400, message: `El código interno '${codigoInterno}' ya existe.` };
                }
                const activeBranches = await tx.branch.findMany({
                    where: { isActive: true },
                    select: { id: true }
                });
                if (!activeBranches.length) {
                    throw { status: 400, message: "No hay sucursales activas para crear el producto" };
                }
                const createdProducts = [];
                for (const branch of activeBranches) {
                    const created = await tx.product.create({
                        data: {
                            sku: dto.sku?.trim() || "",
                            codigoInterno,
                            name: dto.name.trim(),
                            description: dto.description?.trim(),
                            costPrice: dto.costPrice,
                            salePrice: dto.salePrice,
                            priceCurrency: priceCurrency,
                            stock: 0,
                            category: normalizedCategory,
                            brand: normalizedBrand,
                            imageUrl: dto.imageUrl,
                            createdBy: userId,
                            providerId: dto.providerId ? Number(dto.providerId) : null,
                            branchId: branch.id
                        },
                        include: {
                            user: { select: { name: true, userCode: true } },
                            provider: true,
                            branch: { select: { name: true } }
                        },
                    });
                    await tx.priceHistory.create({
                        data: {
                            productId: created.id,
                            oldPrice: 0,
                            newPrice: created.costPrice,
                            priceType: 'cost',
                            changedBy: userId,
                            notes: 'Precio de costo inicial al crear producto maestro'
                        }
                    });
                    await tx.priceHistory.create({
                        data: {
                            productId: created.id,
                            oldPrice: 0,
                            newPrice: created.salePrice,
                            priceType: 'sale',
                            changedBy: userId,
                            notes: 'Precio de venta inicial al crear producto maestro'
                        }
                    });
                    createdProducts.push(created);
                }
                return createdProducts;
            });
        }
        catch (error) {
            if (error?.code === 'P2002') {
                const target = Array.isArray(error?.meta?.target) ? error.meta.target.join(', ') : '';
                throw {
                    status: 400,
                    message: target.includes('sku') || target.includes('Product_sku_key')
                        ? "No se pudo crear el producto maestro porque la base aún tiene una restricción única de SKU global. Aplica la migración para usar unicidad por sucursal (sku, branchId), ejecuta prisma generate y reinicia el backend."
                        : `No se pudo crear el producto por una restricción única (${target || 'desconocida'}).`
                };
            }
            throw error;
        }
    },
    async getAllProducts(includeInactive = true, branchId, onlyInStock = false) {
        return await product_repository_1.productRepository.findAll(includeInactive, branchId, onlyInStock);
    },
    async getProducts(branchId, onlyInStock = false) {
        return await product_repository_1.productRepository.findAllActive(branchId, onlyInStock);
    },
    async getProductById(id) {
        const product = await product_repository_1.productRepository.findById(id);
        if (!product)
            throw new Error("Producto no encontrado");
        return product;
    },
    async updateProduct(id, dto) {
        const normalizedDto = {
            ...dto,
            ...(dto.category !== undefined ? { category: (0, normalizeTextField_1.normalizeTextField)(dto.category) } : {}),
            ...(dto.brand !== undefined ? { brand: (0, normalizeTextField_1.normalizeTextField)(dto.brand) } : {}),
        };
        return await product_repository_1.productRepository.update(id, normalizedDto);
    },
    async getProductMetadata(branchId) {
        const products = await prismaClient_1.prisma.product.findMany({
            where: {
                ...(branchId ? { branchId } : {}),
                isActive: true
            },
            select: { category: true, brand: true }
        });
        const categories = Array.from(new Set(products.map((p) => (0, normalizeTextField_1.normalizeTextField)(p.category)).filter(Boolean)));
        const brands = Array.from(new Set(products.map((p) => (0, normalizeTextField_1.normalizeTextField)(p.brand)).filter(Boolean)));
        return {
            categories: categories.sort((a, b) => a.localeCompare(b, "es-BO")),
            brands: brands.sort((a, b) => a.localeCompare(b, "es-BO"))
        };
    },
    async deleteProduct(id) {
        return await product_repository_1.productRepository.delete(id);
    },
    async deactivateProduct(productId, userId) {
        return prismaClient_1.prisma.product.update({
            where: { id: productId },
            data: {
                isActive: false,
                deactivatedAt: new Date(),
                deactivatedBy: userId
            }
        });
    },
    async activateProduct(productId, userId) {
        return prismaClient_1.prisma.product.update({
            where: { id: productId },
            data: {
                isActive: true,
                deactivatedAt: null,
                deactivatedBy: null
            }
        });
    },
};
