"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockMovementService = void 0;
const client_1 = require("@prisma/client");
const stockMovement_repository_1 = require("../repositories/stockMovement.repository");
const prismaClient_1 = require("../prismaClient");
const normalizeSerialNumbers = (serialNumbers) => (serialNumbers ?? [])
    .map((serial) => String(serial).trim())
    .filter(Boolean);
const validatePurchaseSerialNumbers = (serialNumbers, quantity) => {
    if (serialNumbers.length !== quantity) {
        throw {
            status: 400,
            message: "Debe registrar exactamente un número de serie por cada unidad comprada"
        };
    }
    if (new Set(serialNumbers).size !== serialNumbers.length) {
        throw {
            status: 400,
            message: "Los números de serie no pueden repetirse dentro de la misma compra"
        };
    }
};
const getUnavailableSerialsMessage = (serialNumbers, foundSerials) => {
    const found = new Set(foundSerials.map((item) => item.serialNumber));
    const missing = serialNumbers.filter((serial) => !found.has(serial));
    return missing.join(', ');
};
const validateOutboundSerialNumbers = (serialNumbers, quantity) => {
    if (serialNumbers.length !== quantity) {
        throw {
            status: 400,
            message: "Debe seleccionar exactamente un número de serie por cada unidad"
        };
    }
    if (new Set(serialNumbers).size !== serialNumbers.length) {
        throw {
            status: 400,
            message: "Los números de serie no pueden repetirse"
        };
    }
};
const registerPurchaseTx = async (tx, data, userId) => {
    if (data.quantity <= 0) {
        throw { status: 400, message: "La cantidad debe ser mayor a 0" };
    }
    if (data.unitCost < 0) {
        throw { status: 400, message: "El costo unitario no puede ser negativo" };
    }
    const cleanedSerialNumbers = normalizeSerialNumbers(data.serialNumbers);
    validatePurchaseSerialNumbers(cleanedSerialNumbers, data.quantity);
    const product = await tx.product.findUnique({
        where: { id: data.productId }
    });
    if (!product) {
        throw { status: 404, message: "Producto no encontrado" };
    }
    const existingSerials = await tx.productSerial.findMany({
        where: { serialNumber: { in: cleanedSerialNumbers } },
        select: { serialNumber: true }
    });
    if (existingSerials.length > 0) {
        throw {
            status: 400,
            message: `Los siguientes números de serie ya existen: ${existingSerials.map((item) => item.serialNumber).join(', ')}`
        };
    }
    const previousStock = product.stock;
    const newStock = previousStock + data.quantity;
    await tx.product.update({
        where: { id: data.productId },
        data: {
            stock: newStock,
            costPrice: data.unitCost,
        }
    });
    if (product.costPrice !== data.unitCost) {
        await tx.priceHistory.create({
            data: {
                productId: data.productId,
                oldPrice: product.costPrice,
                newPrice: data.unitCost,
                priceType: 'cost',
                changedBy: userId,
                notes: 'Costo actualizado automáticamente con la última compra registrada'
            }
        });
    }
    await tx.productSerial.createMany({
        data: cleanedSerialNumbers.map((serialNumber) => ({
            productId: data.productId,
            serialNumber,
            status: client_1.ProductSerialStatus.AVAILABLE,
            unitCost: data.unitCost,
            providerId: data.providerId
        }))
    });
    return tx.stockMovement.create({
        data: {
            productId: data.productId,
            movementType: client_1.MovementType.PURCHASE,
            quantity: data.quantity,
            previousStock,
            newStock,
            unitCost: data.unitCost,
            providerId: data.providerId,
            notes: data.notes,
            serialNumbers: cleanedSerialNumbers,
            createdBy: userId
        },
        include: {
            product: { select: { name: true, sku: true } },
            provider: { select: { name: true } },
            user: { select: { name: true } }
        }
    });
};
exports.StockMovementService = {
    /**
     * Registrar una compra de stock
     */
    async registerPurchase(data, userId) {
        return prismaClient_1.prisma.$transaction((tx) => registerPurchaseTx(tx, data, userId));
    },
    async registerPurchaseBatch(data, userId) {
        if (!Array.isArray(data.purchases) || data.purchases.length === 0) {
            throw { status: 400, message: "Debe registrar al menos un producto en la compra" };
        }
        return prismaClient_1.prisma.$transaction(async (tx) => {
            const movements = [];
            for (const purchase of data.purchases) {
                const movement = await registerPurchaseTx(tx, purchase, userId);
                movements.push(movement);
            }
            return movements;
        });
    },
    async getAvailableSerials(productId) {
        const product = await prismaClient_1.prisma.product.findUnique({
            where: { id: productId },
            select: { id: true }
        });
        if (!product) {
            throw { status: 404, message: "Producto no encontrado" };
        }
        const serials = await prismaClient_1.prisma.productSerial.findMany({
            where: {
                productId,
                status: client_1.ProductSerialStatus.AVAILABLE
            },
            orderBy: { serialNumber: 'asc' },
            select: {
                id: true,
                serialNumber: true,
                purchasedAt: true,
                unitCost: true
            }
        });
        if (serials.length === 0) {
            return serials;
        }
        const serialNumbers = serials.map((item) => item.serialNumber);
        const activeBlockedMovements = await prismaClient_1.prisma.stockMovement.findMany({
            where: {
                movementType: {
                    in: [client_1.MovementType.REPAIR_OUT, client_1.MovementType.DEMO_OUT, client_1.MovementType.INTERNAL_USE_OUT]
                },
                isCompleted: false,
                serialNumbers: {
                    hasSome: serialNumbers
                }
            },
            select: { serialNumbers: true }
        });
        const blockedSerials = new Set(activeBlockedMovements.flatMap((movement) => movement.serialNumbers));
        return serials.filter((item) => !blockedSerials.has(item.serialNumber));
    },
    /**
     * Enviar producto a reparación o demo
     */
    async registerOutbound(data, userId) {
        if (data.quantity <= 0) {
            throw { status: 400, message: "La cantidad debe ser mayor a 0" };
        }
        const cleanedSerialNumbers = normalizeSerialNumbers(data.serialNumbers);
        validateOutboundSerialNumbers(cleanedSerialNumbers, data.quantity);
        return prismaClient_1.prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id: data.productId },
                include: { provider: true }
            });
            if (!product) {
                throw { status: 404, message: "Producto no encontrado" };
            }
            if (product.stock < data.quantity) {
                throw { status: 400, message: "Stock insuficiente" };
            }
            const serials = await tx.productSerial.findMany({
                where: {
                    productId: data.productId,
                    serialNumber: { in: cleanedSerialNumbers },
                    status: client_1.ProductSerialStatus.AVAILABLE
                },
                select: { id: true, serialNumber: true }
            });
            if (serials.length !== cleanedSerialNumbers.length) {
                throw {
                    status: 400,
                    message: `Los siguientes números de serie no están disponibles: ${getUnavailableSerialsMessage(cleanedSerialNumbers, serials)}`
                };
            }
            const previousStock = product.stock;
            const newStock = previousStock - data.quantity;
            await tx.product.update({
                where: { id: data.productId },
                data: { stock: newStock }
            });
            await tx.productSerial.updateMany({
                where: {
                    id: { in: serials.map((serial) => serial.id) }
                },
                data: {
                    status: data.movementType === 'REPAIR_OUT' ? client_1.ProductSerialStatus.REPAIR : client_1.ProductSerialStatus.DEMO
                }
            });
            //Asignar automáticamente el provider id si el producto tiene uno
            const movement = await tx.stockMovement.create({
                data: {
                    productId: data.productId,
                    movementType: data.movementType,
                    quantity: -data.quantity, // Negativo para salidas
                    previousStock,
                    newStock,
                    reason: data.reason,
                    notes: data.notes,
                    serialNumbers: cleanedSerialNumbers,
                    createdBy: userId,
                    providerId: product.providerId
                },
                include: {
                    product: {
                        select: {
                            name: true,
                            sku: true,
                            provider: {
                                select: {
                                    id_provider: true,
                                    name: true,
                                    phone: true
                                }
                            }
                        }
                    },
                    provider: { select: { name: true, id_provider: true } },
                    user: { select: { name: true } }
                }
            });
            return movement;
        });
    },
    /**
     * Devolución de venta
     */
    async registerReturn(data, userId) {
        return prismaClient_1.prisma.$transaction(async (tx) => {
            const movements = [];
            for (const item of data.items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId }
                });
                if (!product)
                    continue;
                const previousStock = product.stock;
                const newStock = previousStock + item.quantity;
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: newStock }
                });
                const movement = await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        movementType: client_1.MovementType.RETURN_IN,
                        quantity: item.quantity,
                        previousStock,
                        newStock,
                        saleId: data.saleId,
                        notes: data.notes,
                        createdBy: userId
                    },
                    include: {
                        product: { select: { name: true, sku: true } }
                    }
                });
                movements.push(movement);
            }
            return movements;
        });
    },
    /**
     * Listar movimientos con filtros
     */
    async list(filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const skip = (page - 1) * limit;
        const result = await stockMovement_repository_1.StockMovementRepository.findAll({
            productId: filters.productId,
            movementType: filters.movementType,
            dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
            dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
            skip,
            take: limit,
            saleId: filters.saleId,
            branchId: filters.branchId
        });
        return {
            total: result.total,
            data: result.movements,
            page,
            limit
        };
    },
    /**
     * Historial de un producto específico
     */
    async getProductHistory(productId, branchId) {
        const movements = await stockMovement_repository_1.StockMovementRepository.getProductHistory(productId, branchId);
        // Verificar si se encontraron movimientos
        if (movements.length === 0) {
            console.log(`⚠️ No se encontraron movimientos para el producto ${productId} en la sucursal ${branchId}`);
        }
        else {
            console.log(`📦 Movimientos encontrados: ${movements.length}`);
        }
        return {
            success: true,
            data: movements,
            message: movements.length === 0 ?
                `No se encontraron movimientos para este producto${branchId ? ' en la sucursal especificada' : ''}` :
                `${movements.length} movimientos encontrados`
        };
    },
    /**
     * Actualizar precios de un producto
     */
    async updatePrices(productId, data, userId) {
        const product = await prismaClient_1.prisma.product.findUnique({
            where: { id: productId }
        });
        if (!product) {
            throw { status: 404, message: "Producto no encontrado" };
        }
        const updates = {};
        const priceChanges = [];
        if (data.costPrice !== undefined && data.costPrice !== product.costPrice) {
            updates.costPrice = data.costPrice;
            priceChanges.push(stockMovement_repository_1.PriceHistoryRepository.create({
                productId,
                oldPrice: product.costPrice,
                newPrice: data.costPrice,
                priceType: 'cost',
                changedBy: userId,
                notes: data.notes || `Cambio de precio de costo: ${product.costPrice} → ${data.costPrice}`
            }));
        }
        if (data.salePrice !== undefined && data.salePrice !== product.salePrice) {
            updates.salePrice = data.salePrice;
            priceChanges.push(stockMovement_repository_1.PriceHistoryRepository.create({
                productId,
                oldPrice: product.salePrice,
                newPrice: data.salePrice,
                priceType: 'sale',
                changedBy: userId,
                notes: data.notes || `Cambio de precio de venta: ${product.salePrice} → ${data.salePrice}`
            }));
        }
        if (Object.keys(updates).length === 0) {
            throw { status: 400, message: "No hay cambios en los precios" };
        }
        const [updatedProduct] = await Promise.all([
            prismaClient_1.prisma.product.update({
                where: { id: productId },
                data: updates
            }),
            ...priceChanges
        ]);
        return updatedProduct;
    },
    /**
     * Obtener historial de precios
    */
    async getPriceHistory(productId) {
        console.log(`💰 Buscando historial de precios para producto: ${productId}`);
        const history = await stockMovement_repository_1.PriceHistoryRepository.findAllByProduct(productId);
        console.log(`📈 Registros de precio encontrados: ${history.length}`);
        // Asegurar que devolvemos el formato correcto que espera el frontend
        return {
            success: true,
            data: history
        };
    },
    /**
      * Obtener reparaciones activas
      */
    async getActiveRepairs(branchId) {
        const where = {
            movementType: 'REPAIR_OUT',
            isCompleted: false
        };
        // Filtrar por branchId si se proporciona
        if (branchId !== undefined) {
            where.product = {
                branchId: branchId
            };
        }
        return prismaClient_1.prisma.stockMovement.findMany({
            where,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        stock: true,
                        branchId: true,
                        provider: {
                            select: {
                                id_provider: true,
                                name: true,
                                phone: true
                            }
                        }
                    }
                },
                provider: { select: { name: true, id_provider: true } },
                user: {
                    select: { name: true, userCode: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    },
    /**
      * Obtener demos activas
    */
    async getActiveDemos(branchId) {
        const where = {
            movementType: 'DEMO_OUT',
            isCompleted: false
        };
        // Filtrar por branchId si se proporciona
        if (branchId !== undefined) {
            where.product = {
                branchId: branchId
            };
        }
        return prismaClient_1.prisma.stockMovement.findMany({
            where,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        stock: true,
                        branchId: true
                    }
                },
                user: {
                    select: { name: true, userCode: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    },
    /**
      * Finalizar reparación - Retornar producto al stock
    */
    async completeRepair(repairMovementId, data, userId) {
        return prismaClient_1.prisma.$transaction(async (tx) => {
            // Obtener el movimiento de reparación original
            const repairMovement = await tx.stockMovement.findUnique({
                where: { id: repairMovementId }
            });
            if (!repairMovement) {
                throw { status: 404, message: "Movimiento de reparación no encontrado" };
            }
            // ← NUEVO: Verificar si ya está completado
            if (repairMovement.isCompleted) {
                throw { status: 400, message: "Esta reparación ya fue completada" };
            }
            if (repairMovement.movementType !== 'REPAIR_OUT') {
                throw { status: 400, message: "El movimiento no es de tipo REPAIR_OUT" };
            }
            const product = await tx.product.findUnique({
                where: { id: repairMovement.productId }
            });
            if (!product) {
                throw { status: 404, message: "Producto no encontrado" };
            }
            const quantity = Math.abs(repairMovement.quantity);
            const previousStock = product.stock;
            const newStock = previousStock + quantity;
            const serialNumbers = normalizeSerialNumbers(repairMovement.serialNumbers);
            // Actualizar stock del producto
            await tx.product.update({
                where: { id: product.id },
                data: { stock: newStock }
            });
            if (serialNumbers.length > 0) {
                await tx.productSerial.updateMany({
                    where: {
                        productId: product.id,
                        serialNumber: { in: serialNumbers },
                        status: client_1.ProductSerialStatus.REPAIR
                    },
                    data: { status: client_1.ProductSerialStatus.AVAILABLE }
                });
            }
            // ← NUEVO: Marcar el movimiento original como completado
            await tx.stockMovement.update({
                where: { id: repairMovementId },
                data: {
                    isCompleted: true,
                    completedAt: new Date(),
                    completedBy: userId
                }
            });
            // Registrar el movimiento de retorno
            const returnMovement = await tx.stockMovement.create({
                data: {
                    productId: product.id,
                    movementType: 'REPAIR_RETURN',
                    quantity: quantity,
                    previousStock,
                    newStock,
                    notes: data.notes,
                    reason: data.resolution || 'Reparación completada',
                    serialNumbers,
                    createdBy: userId,
                    isCompleted: true // ← El retorno se marca como completado inmediatamente
                },
                include: {
                    product: { select: { name: true, sku: true } },
                    user: { select: { name: true } }
                }
            });
            return returnMovement;
        });
    },
    /**
      * Finalizar demo - Retornar producto al stock
    */
    async completeDemo(demoMovementId, data, userId) {
        return prismaClient_1.prisma.$transaction(async (tx) => {
            // Obtener el movimiento de reparación original
            const demoMovement = await tx.stockMovement.findUnique({
                where: { id: demoMovementId }
            });
            if (!demoMovement) {
                throw { status: 404, message: "Movimiento de reparación no encontrado" };
            }
            // ← NUEVO: Verificar si ya está completado
            if (demoMovement.isCompleted) {
                throw { status: 400, message: "Esta reparación ya fue completada" };
            }
            if (demoMovement.movementType !== 'DEMO_OUT') {
                throw { status: 400, message: "El movimiento no es de tipo DEMO_OUT" };
            }
            const product = await tx.product.findUnique({
                where: { id: demoMovement.productId }
            });
            if (!product) {
                throw { status: 404, message: "Producto no encontrado" };
            }
            const quantity = Math.abs(demoMovement.quantity);
            const previousStock = product.stock;
            const newStock = previousStock + quantity;
            const serialNumbers = normalizeSerialNumbers(demoMovement.serialNumbers);
            // Actualizar stock del producto
            await tx.product.update({
                where: { id: product.id },
                data: { stock: newStock }
            });
            if (serialNumbers.length > 0) {
                await tx.productSerial.updateMany({
                    where: {
                        productId: product.id,
                        serialNumber: { in: serialNumbers },
                        status: client_1.ProductSerialStatus.DEMO
                    },
                    data: { status: client_1.ProductSerialStatus.AVAILABLE }
                });
            }
            // ← NUEVO: Marcar el movimiento original como completado
            await tx.stockMovement.update({
                where: { id: demoMovementId },
                data: {
                    isCompleted: true,
                    completedAt: new Date(),
                    completedBy: userId
                }
            });
            // Registrar el movimiento de retorno
            const returnMovement = await tx.stockMovement.create({
                data: {
                    productId: product.id,
                    movementType: 'DEMO_RETURN',
                    quantity: quantity,
                    previousStock,
                    newStock,
                    notes: data.notes,
                    reason: data.resolution || 'Reparación completada',
                    serialNumbers,
                    createdBy: userId,
                    isCompleted: true // ← El retorno se marca como completado inmediatamente
                },
                include: {
                    product: { select: { name: true, sku: true } },
                    user: { select: { name: true } }
                }
            });
            return returnMovement;
        });
    },
    /**
     * Registrar ajuste manual de stock
     */
    async registerAdjustment(data, userId) {
        if (data.quantity === 0) {
            throw { status: 400, message: "La cantidad no puede ser 0" };
        }
        if (!data.reason || data.reason.trim() === '') {
            throw { status: 400, message: "La razón/justificación es obligatoria" };
        }
        return prismaClient_1.prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id: data.productId }
            });
            if (!product) {
                throw { status: 404, message: "Producto no encontrado" };
            }
            const previousStock = product.stock;
            const newStock = previousStock + data.quantity;
            // Permitir stock negativo en ajustes manuales para reflejar faltantes/mermas
            // Actualizar stock del producto
            await tx.product.update({
                where: { id: data.productId },
                data: { stock: newStock }
            });
            // Registrar movimiento de ajuste
            const movement = await tx.stockMovement.create({
                data: {
                    productId: data.productId,
                    movementType: 'ADJUSTMENT',
                    quantity: data.quantity,
                    previousStock,
                    newStock,
                    reason: data.reason,
                    notes: data.notes,
                    createdBy: userId,
                },
                include: {
                    product: {
                        select: {
                            name: true,
                            sku: true,
                            branch: {
                                select: { name: true }
                            }
                        }
                    },
                    user: { select: { name: true, userCode: true } }
                }
            });
            return movement;
        });
    },
    /**
     * Registrar salida por uso interno
     */
    async registerInternalUseOut(data, userId) {
        if (data.quantity <= 0) {
            throw { status: 400, message: "La cantidad debe ser mayor a 0" };
        }
        if (!data.reason || data.reason.trim() === '') {
            throw { status: 400, message: "La razón/justificación es obligatoria" };
        }
        const cleanedSerialNumbers = normalizeSerialNumbers(data.serialNumbers);
        validateOutboundSerialNumbers(cleanedSerialNumbers, data.quantity);
        return prismaClient_1.prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id: data.productId }
            });
            if (!product) {
                throw { status: 404, message: "Producto no encontrado" };
            }
            if (product.stock < data.quantity) {
                throw { status: 400, message: "Stock insuficiente" };
            }
            const serials = await tx.productSerial.findMany({
                where: {
                    productId: data.productId,
                    serialNumber: { in: cleanedSerialNumbers },
                    status: client_1.ProductSerialStatus.AVAILABLE
                },
                select: { id: true, serialNumber: true }
            });
            if (serials.length !== cleanedSerialNumbers.length) {
                throw {
                    status: 400,
                    message: `Los siguientes números de serie no están disponibles: ${getUnavailableSerialsMessage(cleanedSerialNumbers, serials)}`
                };
            }
            const previousStock = product.stock;
            const newStock = previousStock - data.quantity;
            // Actualizar stock del producto
            await tx.product.update({
                where: { id: data.productId },
                data: { stock: newStock }
            });
            await tx.productSerial.updateMany({
                where: {
                    id: { in: serials.map((serial) => serial.id) }
                },
                data: { status: client_1.ProductSerialStatus.INTERNAL_USE }
            });
            // Registrar movimiento de salida por uso interno
            const movement = await tx.stockMovement.create({
                data: {
                    productId: data.productId,
                    movementType: 'INTERNAL_USE_OUT',
                    quantity: -data.quantity, // Negativo para salidas
                    previousStock,
                    newStock,
                    reason: data.reason,
                    notes: data.notes,
                    serialNumbers: cleanedSerialNumbers,
                    destination: data.destination,
                    expectedReturnDate: data.expectedReturnDate,
                    createdBy: userId,
                    isCompleted: false // ← Para poder rastrear si fue devuelto
                },
                include: {
                    product: {
                        select: {
                            name: true,
                            sku: true,
                            branch: {
                                select: { name: true }
                            }
                        }
                    },
                    user: { select: { name: true, userCode: true } }
                }
            });
            return movement;
        });
    },
    /**
     * Obtener usos internos activos
     */
    async getActiveInternalUses(branchId) {
        const where = {
            movementType: 'INTERNAL_USE_OUT',
            isCompleted: false
        };
        if (branchId !== undefined) {
            where.product = {
                branchId: branchId
            };
        }
        return prismaClient_1.prisma.stockMovement.findMany({
            where,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        stock: true,
                        branchId: true,
                        branch: {
                            select: { name: true }
                        }
                    }
                },
                user: {
                    select: { name: true, userCode: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    },
    /**
     * Retornar producto de uso interno
     */
    async returnInternalUse(internalUseMovementId, data, userId) {
        return prismaClient_1.prisma.$transaction(async (tx) => {
            // Obtener el movimiento original de uso interno
            const internalUseMovement = await tx.stockMovement.findUnique({
                where: { id: internalUseMovementId }
            });
            if (!internalUseMovement) {
                throw { status: 404, message: "Movimiento de uso interno no encontrado" };
            }
            if (internalUseMovement.movementType !== 'INTERNAL_USE_OUT') {
                throw { status: 400, message: "El movimiento no es de tipo INTERNAL_USE_OUT" };
            }
            if (internalUseMovement.isCompleted) {
                throw { status: 400, message: "Este uso interno ya fue devuelto" };
            }
            const product = await tx.product.findUnique({
                where: { id: internalUseMovement.productId }
            });
            if (!product) {
                throw { status: 404, message: "Producto no encontrado" };
            }
            const quantity = Math.abs(internalUseMovement.quantity);
            const previousStock = product.stock;
            const newStock = previousStock + quantity;
            const serialNumbers = normalizeSerialNumbers(internalUseMovement.serialNumbers);
            // Actualizar stock del producto
            await tx.product.update({
                where: { id: product.id },
                data: { stock: newStock }
            });
            if (serialNumbers.length > 0) {
                await tx.productSerial.updateMany({
                    where: {
                        productId: product.id,
                        serialNumber: { in: serialNumbers },
                        status: client_1.ProductSerialStatus.INTERNAL_USE
                    },
                    data: { status: client_1.ProductSerialStatus.AVAILABLE }
                });
            }
            // Marcar el movimiento original como completado
            await tx.stockMovement.update({
                where: { id: internalUseMovementId },
                data: {
                    isCompleted: true,
                    completedAt: new Date(),
                    completedBy: userId
                }
            });
            // Registrar el movimiento de retorno
            const returnMovement = await tx.stockMovement.create({
                data: {
                    productId: product.id,
                    movementType: 'INTERNAL_USE_RETURN',
                    quantity: quantity,
                    previousStock,
                    newStock,
                    notes: data.notes,
                    reason: data.condition || 'Producto devuelto de uso interno',
                    serialNumbers,
                    createdBy: userId,
                    isCompleted: true
                },
                include: {
                    product: {
                        select: {
                            name: true,
                            sku: true,
                            branch: {
                                select: { name: true }
                            }
                        }
                    },
                    user: { select: { name: true } }
                }
            });
            return returnMovement;
        });
    },
    async registerTransferBetweenBranches(data, userId) {
        if (data.quantity <= 0) {
            throw { status: 400, message: "La cantidad debe ser mayor a 0" };
        }
        const cleanedSerialNumbers = normalizeSerialNumbers(data.serialNumbers);
        validateOutboundSerialNumbers(cleanedSerialNumbers, data.quantity);
        return prismaClient_1.prisma.$transaction(async (tx) => {
            const sourceProduct = await tx.product.findUnique({
                where: { id: data.productId },
                include: { branch: true }
            });
            if (!sourceProduct) {
                throw { status: 404, message: "Producto no encontrado" };
            }
            if (sourceProduct.stock < data.quantity) {
                throw { status: 400, message: "Stock insuficiente para la transferencia" };
            }
            if (sourceProduct.branchId === data.destinationBranchId) {
                throw { status: 400, message: "La sucursal destino debe ser diferente a la sucursal origen" };
            }
            const destinationBranch = await tx.branch.findUnique({
                where: { id: data.destinationBranchId }
            });
            if (!destinationBranch) {
                throw { status: 404, message: "Sucursal destino no encontrada" };
            }
            const serials = await tx.productSerial.findMany({
                where: {
                    productId: sourceProduct.id,
                    serialNumber: { in: cleanedSerialNumbers },
                    status: client_1.ProductSerialStatus.AVAILABLE
                },
                select: { id: true, serialNumber: true }
            });
            if (serials.length !== cleanedSerialNumbers.length) {
                throw {
                    status: 400,
                    message: `Los siguientes números de serie no están disponibles: ${getUnavailableSerialsMessage(cleanedSerialNumbers, serials)}`
                };
            }
            let destinationProduct = await tx.product.findFirst({
                where: {
                    sku: sourceProduct.sku || "",
                    branchId: data.destinationBranchId
                }
            });
            if (!destinationProduct) {
                destinationProduct = await tx.product.create({
                    data: {
                        sku: sourceProduct.sku || "",
                        name: sourceProduct.name,
                        salePrice: sourceProduct.salePrice,
                        costPrice: sourceProduct.costPrice,
                        description: sourceProduct.description,
                        brand: sourceProduct.brand,
                        category: sourceProduct.category,
                        stock: 0,
                        branchId: data.destinationBranchId,
                        createdBy: userId,
                        providerId: sourceProduct.providerId,
                        imageUrl: sourceProduct.imageUrl,
                        imagePublicId: sourceProduct.imagePublicId,
                        isActive: sourceProduct.isActive,
                        priceCurrency: sourceProduct.priceCurrency,
                        codigoInterno: sourceProduct.codigoInterno
                    }
                });
            }
            const sourcePreviousStock = sourceProduct.stock;
            const sourceNewStock = sourcePreviousStock - data.quantity;
            const destinationPreviousStock = destinationProduct.stock;
            const destinationNewStock = destinationPreviousStock + data.quantity;
            await tx.product.update({
                where: { id: sourceProduct.id },
                data: { stock: sourceNewStock }
            });
            await tx.product.update({
                where: { id: destinationProduct.id },
                data: { stock: destinationNewStock }
            });
            await tx.productSerial.updateMany({
                where: {
                    id: { in: serials.map((serial) => serial.id) }
                },
                data: {
                    status: client_1.ProductSerialStatus.AVAILABLE,
                    productId: destinationProduct.id
                }
            });
            const outboundMovement = await tx.stockMovement.create({
                data: {
                    productId: sourceProduct.id,
                    movementType: client_1.MovementType.TRANSFER_OUT,
                    quantity: -data.quantity,
                    previousStock: sourcePreviousStock,
                    newStock: sourceNewStock,
                    reason: data.reason,
                    notes: data.notes,
                    destination: destinationBranch.name,
                    serialNumbers: cleanedSerialNumbers,
                    createdBy: userId,
                    branchId: sourceProduct.branchId
                }
            });
            const inboundMovement = await tx.stockMovement.create({
                data: {
                    productId: destinationProduct.id,
                    movementType: client_1.MovementType.TRANSFER_IN,
                    quantity: data.quantity,
                    previousStock: destinationPreviousStock,
                    newStock: destinationNewStock,
                    reason: `Transferencia recibida desde ${sourceProduct.branch.name}`,
                    notes: data.notes,
                    destination: sourceProduct.branch.name,
                    serialNumbers: cleanedSerialNumbers,
                    createdBy: userId,
                    branchId: destinationProduct.branchId,
                    isCompleted: true
                }
            });
            return { outboundMovement, inboundMovement };
        });
    }
};
