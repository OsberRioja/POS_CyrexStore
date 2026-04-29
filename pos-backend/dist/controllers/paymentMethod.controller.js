"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodController = void 0;
const paymentMethod_service_1 = require("../services/paymentMethod.service");
exports.PaymentMethodController = {
    async list(req, res) {
        try {
            const list = await paymentMethod_service_1.PaymentMethodService.listAll();
            res.json(list);
        }
        catch (err) {
            console.error("GET /payment-methods", err);
            res.status(500).json({ error: "Error interno" });
        }
    },
    async getById(req, res) {
        try {
            const id = Number(req.params.id);
            const pm = await paymentMethod_service_1.PaymentMethodService.getById(id);
            res.json(pm);
        }
        catch (err) {
            res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    async create(req, res) {
        try {
            const dto = req.body;
            const created = await paymentMethod_service_1.PaymentMethodService.create(dto);
            res.status(201).json(created);
        }
        catch (err) {
            res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    async update(req, res) {
        try {
            const id = Number(req.params.id);
            const dto = req.body;
            const updated = await paymentMethod_service_1.PaymentMethodService.update(id, dto);
            res.json(updated);
        }
        catch (err) {
            res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    async remove(req, res) {
        try {
            const id = Number(req.params.id);
            const deleted = await paymentMethod_service_1.PaymentMethodService.remove(id);
            res.json({ message: "Eliminado", deleted });
        }
        catch (err) {
            res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    /** endpoint útil para forzar creación de defaults (opcional) */
    async initDefaults(_req, res) {
        try {
            const created = await paymentMethod_service_1.PaymentMethodService.ensureDefaults();
            res.json({ ok: true, created });
        }
        catch (err) {
            res.status(500).json({ error: "Error inicializando métodos por defecto" });
        }
    },
    async summaryByBox(req, res) {
        try {
            const cashBoxId = req.query.cashBoxId ? Number(req.query.cashBoxId) : undefined;
            if (!cashBoxId || Number.isNaN(cashBoxId))
                return res.status(400).json({ error: "cashBoxId requerido" });
            const data = await paymentMethod_service_1.PaymentMethodService.summaryByCashBox(cashBoxId);
            return res.json(data);
        }
        catch (err) {
            return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    }
};
