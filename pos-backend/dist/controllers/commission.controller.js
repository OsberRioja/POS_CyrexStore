"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommissionController = void 0;
const commission_service_1 = require("../services/commission.service");
const commission_dto_1 = require("../dtos/commission.dto");
exports.CommissionController = {
    /**
     * Obtener la configuración activa
     */
    async getActive(req, res) {
        try {
            const config = await commission_service_1.CommissionService.getActive();
            res.json(config);
        }
        catch (error) {
            res.status(error.status || 500).json({ message: error.message });
        }
    },
    /**
     * Obtener todas las configuraciones
     */
    async getAll(req, res) {
        try {
            const configs = await commission_service_1.CommissionService.getAll();
            res.json(configs);
        }
        catch (error) {
            res.status(error.status || 500).json({ message: error.message });
        }
    },
    /**
     * Obtener una configuración por ID
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const config = await commission_service_1.CommissionService.getById(id);
            res.json(config);
        }
        catch (error) {
            res.status(error.status || 500).json({ message: error.message });
        }
    },
    /**
     * Crear una nueva configuración
     */
    async create(req, res) {
        try {
            // Validar el cuerpo de la solicitud
            const validatedData = commission_dto_1.CommissionConfigSchema.parse(req.body);
            const config = await commission_service_1.CommissionService.create(validatedData, req.userId);
            res.status(201).json(config);
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
     * Actualizar una configuración
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const validatedData = commission_dto_1.UpdateCommissionConfigSchema.parse(req.body);
            const config = await commission_service_1.CommissionService.update(id, validatedData);
            res.json(config);
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
     * Activar una configuración
     */
    async activate(req, res) {
        try {
            const { id } = req.params;
            const config = await commission_service_1.CommissionService.activate(id);
            res.json(config);
        }
        catch (error) {
            res.status(error.status || 500).json({ message: error.message });
        }
    },
    /**
     * Eliminar una configuración
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            await commission_service_1.CommissionService.delete(id);
            res.status(204).send();
        }
        catch (error) {
            res.status(error.status || 500).json({ message: error.message });
        }
    }
};
