"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaleEditService = void 0;
const client_1 = require("@prisma/client");
const commissionCalculation_service_1 = require("./commissionCalculation.service");
const prisma = new client_1.PrismaClient();
// Helper function para calcular estado de pago
function calculatePaymentStatus(total, totalPaid) {
    if (totalPaid <= 0)
        return client_1.PaymentStatus.PENDING;
    if (Math.abs(totalPaid - total) < 0.01)
        return client_1.PaymentStatus.PAID; // considerando precisión decimal
    if (totalPaid > total)
        return client_1.PaymentStatus.OVERPAID;
    return client_1.PaymentStatus.PARTIAL;
}
exports.SaleEditService = {
    /**
     * Actualiza una venta existente
     * Solo permitido si la caja está en estado REOPENED
     */
    async updateSale(saleId, dto, actorUserId, branchId) {
        return await prisma.$transaction(async (tx) => {
            // 1. Obtener venta actual
            const sale = await tx.sale.findUnique({
                where: { id: saleId },
                include: {
                    items: true,
                    payments: true,
                    cashBox: true
                }
            });
            if (!sale) {
                throw { status: 404, message: "Venta no encontrada" };
            }
            // 2. Verificar que la caja está REOPENED o OPEN
            if (sale.cashBox?.status !== "REOPENED" && sale.cashBox?.status !== "OPEN") {
                throw {
                    status: 400,
                    message: "Solo se pueden editar ventas en cajas reabiertas o abiertas"
                };
            }
            // 3. Verificar que la caja pertenece a la misma sucursal
            if (sale.branchId !== branchId) {
                throw {
                    status: 403,
                    message: "La venta no pertenece a esta sucursal"
                };
            }
            let updatedItems = dto.items || sale.items;
            let updatedPayments = dto.payments || sale.payments;
            // 4. Restaurar stock de productos de la venta original
            for (const item of sale.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } }
                });
                // Registrar movimiento de reversión
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                    select: { stock: true }
                });
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        movementType: client_1.MovementType.SALE_REVERSAL,
                        quantity: item.quantity,
                        previousStock: product?.stock || 0,
                        newStock: (product?.stock || 0) + item.quantity,
                        saleId: sale.id,
                        createdBy: actorUserId,
                        notes: `Reversión por edición de venta ${sale.id}`,
                        branchId: branchId
                    }
                });
            }
            // 5. Eliminar items y pagos antiguos
            await tx.saleItem.deleteMany({ where: { saleId } });
            await tx.salePayment.deleteMany({ where: { saleId } });
            // 6. Eliminar comisión anterior si existe
            await tx.commission.deleteMany({ where: { saleId } });
            // 7. Validar nuevos items y calcular total
            let calculatedTotal = 0;
            const itemsToCreate = [];
            for (const it of updatedItems) {
                const product = await tx.product.findUnique({
                    where: { id: it.productId }
                });
                if (!product) {
                    throw { status: 404, message: `Producto ${it.productId} no encontrado` };
                }
                if (product.stock < it.quantity) {
                    throw {
                        status: 400,
                        message: `Stock insuficiente para producto ${product.name}. Stock disponible: ${product.stock}`
                    };
                }
                const unitPrice = Number(it.unitPrice);
                const subtotal = unitPrice * Number(it.quantity);
                calculatedTotal += subtotal;
                itemsToCreate.push({
                    productId: it.productId,
                    quantity: it.quantity,
                    unitPrice,
                    subtotal,
                    originalPrice: it.originalPrice || unitPrice,
                    originalCurrency: it.originalCurrency || 'BOB',
                    conversionRate: it.conversionRate || 1
                });
            }
            // 8. Validar pagos
            const totalPaid = updatedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
            if (totalPaid < 0) {
                throw { status: 400, message: 'El monto pagado no puede ser negativo' };
            }
            if (totalPaid < calculatedTotal && !dto.allowPartialPayment) {
                throw {
                    status: 400,
                    message: `Suma de pagos (${totalPaid}) no cubre el total (${calculatedTotal}). Use allowPartialPayment=true si es necesario.`
                };
            }
            // 9. Crear nuevos items y decrementar stock
            const paymentStatus = calculatePaymentStatus(calculatedTotal, totalPaid);
            const balance = Math.max(0, calculatedTotal - totalPaid);
            for (const item of itemsToCreate) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } }
                });
                // Registrar nuevo movimiento de stock
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                    select: { stock: true }
                });
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        movementType: client_1.MovementType.SALE,
                        quantity: -item.quantity,
                        previousStock: (product?.stock || 0) + item.quantity,
                        newStock: product?.stock || 0,
                        saleId: sale.id,
                        createdBy: actorUserId,
                        notes: `Venta editada ${sale.id}`,
                        branchId: branchId
                    }
                });
            }
            // 10. Actualizar venta con nuevos datos
            const updatedSale = await tx.sale.update({
                where: { id: saleId },
                data: {
                    total: Number(calculatedTotal.toFixed(2)),
                    totalPaid: Number(totalPaid.toFixed(2)),
                    balance: Number(balance.toFixed(2)),
                    paymentStatus,
                    items: { create: itemsToCreate },
                    payments: {
                        create: updatedPayments.map((p) => ({
                            paymentMethodId: p.paymentMethodId,
                            amount: Number(p.amount)
                        }))
                    }
                },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    name: true,
                                    sku: true
                                }
                            }
                        }
                    },
                    payments: {
                        include: {
                            paymentMethod: {
                                select: {
                                    name: true,
                                    isCash: true
                                }
                            }
                        }
                    },
                    seller: {
                        select: {
                            name: true,
                            userCode: true
                        }
                    },
                    client: true,
                    branch: { select: { name: true } }
                }
            });
            // 11. Recalcular comisión si existe
            try {
                // Verifica que el servicio exista o implementa la función
                const commissionAmount = await commissionCalculation_service_1.CommissionCalculationService.calculateCommission(calculatedTotal);
                if (commissionAmount > 0) {
                    await tx.commission.create({
                        data: {
                            saleId: sale.id,
                            userId: sale.sellerId,
                            amount: commissionAmount,
                            month: updatedSale.createdAt.getMonth() + 1,
                            year: updatedSale.createdAt.getFullYear()
                        }
                    });
                }
            }
            catch (err) {
                console.error("Error al recalcular comisión:", err);
                // No lanzar error si falla la comisión
            }
            return updatedSale;
        });
    }
};
