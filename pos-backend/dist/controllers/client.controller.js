"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClienteController = void 0;
const client_service_1 = require("../services/client.service");
exports.ClienteController = {
    async create(req, res) {
        try {
            const dto = req.body;
            const created = await client_service_1.ClienteService.createCliente(dto);
            res.status(201).json(created);
        }
        catch (err) {
            res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    async list(req, res) {
        try {
            const q = typeof req.query.q === "string" ? req.query.q : undefined;
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 20;
            const result = await client_service_1.ClienteService.searchClients(q, page, limit);
            // Devolver formato consistente: { data, total, page, limit }
            return res.json({
                data: result.data,
                total: result.total,
                page,
                limit,
            });
        }
        catch (err) {
            console.error("Error GET /api/clients:", err);
            return res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    async getSales(req, res) {
        try {
            const id = Number(req.params.id);
            const sales = await client_service_1.ClienteService.getClientSales(id);
            res.json(sales);
        }
        catch (err) {
            res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    async getById(req, res) {
        try {
            const id = Number(req.params.id);
            const c = await client_service_1.ClienteService.getClienteById(id);
            res.json(c);
        }
        catch (err) {
            res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    async update(req, res) {
        try {
            const id = Number(req.params.id);
            const dto = req.body;
            const updated = await client_service_1.ClienteService.updateCliente(id, dto);
            res.json(updated);
        }
        catch (err) {
            res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    async remove(req, res) {
        try {
            const id = Number(req.params.id);
            const deleted = await client_service_1.ClienteService.deleteCliente(id);
            res.json({ message: "Cliente eliminado", deleted });
        }
        catch (err) {
            res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
};
