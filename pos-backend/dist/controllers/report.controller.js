"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportController = void 0;
const report_service_1 = require("../services/report.service");
exports.reportController = {
    async getAvailableSellers(req, res) {
        try {
            const { branchId } = req.query;
            const sellers = await report_service_1.reportService.getAvailableSellers(branchId ? parseInt(branchId) : undefined);
            return res.json(sellers);
        }
        catch (error) {
            console.error('Error obteniendo vendedores para reportes:', error);
            return res.status(error.status || 500).json({
                error: error.message || 'Error interno del servidor'
            });
        }
    },
    async downloadSalesReport(req, res) {
        try {
            const { cashBoxId } = req.params;
            if (!cashBoxId) {
                return res.status(400).json({ error: 'ID de caja requerido' });
            }
            const buffer = await report_service_1.reportService.generateSalesReport(Number(cashBoxId));
            // Configurar headers para descarga
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="reporte-ventas-caja-${cashBoxId}.xlsx"`);
            res.setHeader('Content-Length', buffer.byteLength);
            return res.send(buffer);
        }
        catch (error) {
            console.error('Error generando reporte de ventas:', error);
            return res.status(error.status || 500).json({
                error: error.message || 'Error interno del servidor'
            });
        }
    },
    async downloadExpensesReport(req, res) {
        try {
            const { cashBoxId } = req.params;
            if (!cashBoxId) {
                return res.status(400).json({ error: 'ID de caja requerido' });
            }
            const buffer = await report_service_1.reportService.generateExpensesReport(Number(cashBoxId));
            // Configurar headers para descarga
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="reporte-gastos-caja-${cashBoxId}.xlsx"`);
            res.setHeader('Content-Length', buffer.byteLength);
            return res.send(buffer);
        }
        catch (error) {
            console.error('Error generando reporte de gastos:', error);
            return res.status(error.status || 500).json({
                error: error.message || 'Error interno del servidor'
            });
        }
    },
    async downloadPaymentMethodsReport(req, res) {
        try {
            const { cashBoxId } = req.params;
            if (!cashBoxId) {
                return res.status(400).json({ error: 'ID de caja requerido' });
            }
            const buffer = await report_service_1.reportService.generatePaymentMethodsReport(Number(cashBoxId));
            // Configurar headers para descarga
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="reporte-metodos-pago-caja-${cashBoxId}.xlsx"`);
            res.setHeader('Content-Length', buffer.byteLength);
            return res.send(buffer);
        }
        catch (error) {
            console.error('Error generando reporte de métodos de pago:', error);
            return res.status(error.status || 500).json({
                error: error.message || 'Error interno del servidor'
            });
        }
    },
    async downloadDailyReport(req, res) {
        try {
            const { cashBoxId } = req.params;
            if (!cashBoxId) {
                return res.status(400).json({ error: 'ID de caja requerido' });
            }
            const buffer = await report_service_1.reportService.generateDailyReport(Number(cashBoxId));
            // Configurar headers para descarga
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="reporte-diario-caja-${cashBoxId}.xlsx"`);
            res.setHeader('Content-Length', buffer.byteLength);
            return res.send(buffer);
        }
        catch (error) {
            console.error('Error generando reporte diario:', error);
            return res.status(error.status || 500).json({
                error: error.message || 'Error interno del servidor'
            });
        }
    },
    async downloadMonthlySalesReport(req, res) {
        try {
            const { year, month } = req.params;
            const { branchId } = req.query;
            const filters = {
                year: parseInt(year),
                month: parseInt(month),
                branchId: branchId ? parseInt(branchId) : undefined
            };
            const buffer = await report_service_1.reportService.generateMonthlySalesReport(filters);
            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            const monthName = monthNames[filters.month - 1];
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="reporte-ventas-${monthName.toLowerCase()}-${year}.xlsx"`);
            res.setHeader('Content-Length', buffer.byteLength);
            return res.send(buffer);
        }
        catch (error) {
            console.error('Error generando reporte mensual:', error);
            return res.status(error.status || 500).json({
                error: error.message || 'Error interno del servidor'
            });
        }
    },
    async downloadPeriodSalesReport(req, res) {
        try {
            const { startDate, endDate, branchId, sellerId, sellerIds, paymentMethodId } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'Fecha inicio y fecha fin requeridas' });
            }
            const parsedSellerIds = typeof sellerIds === 'string'
                ? sellerIds.split(',').map(id => id.trim()).filter(Boolean)
                : undefined;
            const filters = {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                branchId: branchId ? parseInt(branchId) : undefined,
                sellerId: sellerId,
                sellerIds: parsedSellerIds,
                paymentMethodId: paymentMethodId ? parseInt(paymentMethodId) : undefined,
                reportType: 'sales'
            };
            const buffer = await report_service_1.reportService.generatePeriodSalesReport(filters);
            const startStr = filters.startDate.toISOString().split('T')[0];
            const endStr = filters.endDate.toISOString().split('T')[0];
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="reporte-ventas-${startStr}-al-${endStr}.xlsx"`);
            res.setHeader('Content-Length', buffer.byteLength);
            return res.send(buffer);
        }
        catch (error) {
            console.error('Error generando reporte por período:', error);
            return res.status(error.status || 500).json({
                error: error.message || 'Error interno del servidor'
            });
        }
    },
    async getPeriodSalesPreview(req, res) {
        try {
            const { startDate, endDate, branchId, sellerId, sellerIds, paymentMethodId } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'Fecha inicio y fecha fin requeridas' });
            }
            const parsedSellerIds = typeof sellerIds === 'string'
                ? sellerIds.split(',').map(id => id.trim()).filter(Boolean)
                : undefined;
            const filters = {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                branchId: branchId ? parseInt(branchId) : undefined,
                sellerId: sellerId,
                sellerIds: parsedSellerIds,
                paymentMethodId: paymentMethodId ? parseInt(paymentMethodId) : undefined,
                reportType: 'sales'
            };
            const preview = await report_service_1.reportService.getPeriodSalesPreview(filters);
            return res.json(preview);
        }
        catch (error) {
            console.error('Error generando preview de reporte de ventas:', error);
            return res.status(error.status || 500).json({
                error: error.message || 'Error interno del servidor'
            });
        }
    },
    async getPeriodExpensesPreview(req, res) {
        try {
            const { startDate, endDate, branchId, paymentMethodId } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'Fecha inicio y fecha fin requeridas' });
            }
            const filters = {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                branchId: branchId ? parseInt(branchId) : undefined,
                paymentMethodId: paymentMethodId ? parseInt(paymentMethodId) : undefined,
                reportType: 'expenses'
            };
            const preview = await report_service_1.reportService.getPeriodExpensesPreview(filters);
            return res.json(preview);
        }
        catch (error) {
            console.error('Error generando preview de reporte de gastos:', error);
            return res.status(error.status || 500).json({
                error: error.message || 'Error interno del servidor'
            });
        }
    },
    async getCombinedPreview(req, res) {
        try {
            const { startDate, endDate, branchId, sellerId, sellerIds, paymentMethodId } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'Fecha inicio y fecha fin requeridas' });
            }
            const parsedSellerIds = typeof sellerIds === 'string'
                ? sellerIds.split(',').map(id => id.trim()).filter(Boolean)
                : undefined;
            const filters = {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                branchId: branchId ? parseInt(branchId) : undefined,
                sellerId: sellerId,
                sellerIds: parsedSellerIds,
                paymentMethodId: paymentMethodId ? parseInt(paymentMethodId) : undefined,
                reportType: 'combined'
            };
            const preview = await report_service_1.reportService.getCombinedPreview(filters);
            return res.json(preview);
        }
        catch (error) {
            console.error('Error generando preview de reporte combinado:', error);
            return res.status(error.status || 500).json({
                error: error.message || 'Error interno del servidor'
            });
        }
    },
    async downloadPeriodExpensesReport(req, res) {
        try {
            const { startDate, endDate, branchId, paymentMethodId } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'Fecha inicio y fecha fin requeridas' });
            }
            const filters = {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                branchId: branchId ? parseInt(branchId) : undefined,
                paymentMethodId: paymentMethodId ? parseInt(paymentMethodId) : undefined,
                reportType: 'expenses'
            };
            const buffer = await report_service_1.reportService.generatePeriodExpensesReport(filters);
            const startStr = filters.startDate.toISOString().split('T')[0];
            const endStr = filters.endDate.toISOString().split('T')[0];
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="reporte-gastos-${startStr}-al-${endStr}.xlsx"`);
            res.setHeader('Content-Length', buffer.byteLength);
            return res.send(buffer);
        }
        catch (error) {
            console.error('Error generando reporte de gastos por período:', error);
            return res.status(error.status || 500).json({
                error: error.message || 'Error interno del servidor'
            });
        }
    },
    async downloadCombinedReport(req, res) {
        try {
            const { startDate, endDate, branchId } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'Fecha inicio y fecha fin requeridas' });
            }
            // Generar ambos reportes y combinarlos
            const salesFilters = {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                branchId: branchId ? parseInt(branchId) : undefined,
                reportType: 'sales'
            };
            const expensesFilters = {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                branchId: branchId ? parseInt(branchId) : undefined,
                reportType: 'expenses'
            };
            // Aquí se podría implementar la combinación de ambos reportes
            // Por ahora, generaremos solo el de ventas
            const buffer = await report_service_1.reportService.generatePeriodSalesReport(salesFilters);
            const startStr = salesFilters.startDate.toISOString().split('T')[0];
            const endStr = salesFilters.endDate.toISOString().split('T')[0];
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="reporte-combinado-${startStr}-al-${endStr}.xlsx"`);
            res.setHeader('Content-Length', buffer.byteLength);
            return res.send(buffer);
        }
        catch (error) {
            console.error('Error generando reporte combinado:', error);
            return res.status(error.status || 500).json({
                error: error.message || 'Error interno del servidor'
            });
        }
    }
};
