"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommissionReportController = void 0;
const commissionReport_service_1 = require("../services/commissionReport.service");
const commissionReport_dto_1 = require("../dtos/commissionReport.dto");
exports.CommissionReportController = {
    /**
     * Obtener comisiones por mes y año
     */
    async getCommissionsByMonth(req, res) {
        try {
            const validatedQuery = commissionReport_dto_1.CommissionReportQuerySchema.parse({
                month: parseInt(req.query.month),
                year: parseInt(req.query.year),
                page: req.query.page ? parseInt(req.query.page) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            });
            const result = await commissionReport_service_1.CommissionReportService.getCommissionsByMonth(validatedQuery.month, validatedQuery.year, validatedQuery.page, validatedQuery.limit);
            res.json(result);
        }
        catch (error) {
            if (error.name === 'ZodError') {
                res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
            }
            else {
                res.status(error.status || 500).json({ message: error.message });
            }
        }
    },
    /**
     * Obtener resumen de comisiones por mes y año
     */
    async getSummaryByMonth(req, res) {
        try {
            const validatedQuery = commissionReport_dto_1.CommissionReportQuerySchema.parse({
                month: parseInt(req.query.month),
                year: parseInt(req.query.year),
            });
            const result = await commissionReport_service_1.CommissionReportService.getSummaryByMonth(validatedQuery.month, validatedQuery.year);
            res.json(result);
        }
        catch (error) {
            if (error.name === 'ZodError') {
                res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
            }
            else {
                res.status(error.status || 500).json({ message: error.message });
            }
        }
    },
    /**
     * Obtener reporte de comisiones por usuario en un rango de fechas
     */
    async getUserCommissionsReport(req, res) {
        try {
            const { userId } = req.params;
            const validatedQuery = commissionReport_dto_1.UserCommissionReportQuerySchema.parse({
                userId,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
            });
            const result = await commissionReport_service_1.CommissionReportService.getUserCommissionsReport(validatedQuery.userId, validatedQuery.startDate, validatedQuery.endDate);
            res.json(result);
        }
        catch (error) {
            if (error.name === 'ZodError') {
                res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
            }
            else {
                res.status(error.status || 500).json({ message: error.message });
            }
        }
    },
    /**
     * Obtener comisiones por usuario y mes
     */
    async getCommissionsByUserAndMonth(req, res) {
        try {
            const { userId } = req.params;
            const validatedQuery = commissionReport_dto_1.CommissionReportQuerySchema.parse({
                month: parseInt(req.query.month),
                year: parseInt(req.query.year),
            });
            const result = await commissionReport_service_1.CommissionReportService.getCommissionsByUserAndMonth(userId, validatedQuery.month, validatedQuery.year);
            res.json(result);
        }
        catch (error) {
            if (error.name === 'ZodError') {
                res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
            }
            else {
                res.status(error.status || 500).json({ message: error.message });
            }
        }
    }
};
