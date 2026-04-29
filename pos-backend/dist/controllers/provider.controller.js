"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderController = void 0;
const provider_service_1 = require("../services/provider.service");
exports.ProviderController = {
    async create(req, res) {
        try {
            const dto = req.body;
            const created = await provider_service_1.ProviderService.createProveedor(dto);
            res.status(201).json(created);
        }
        catch (err) {
            res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    async list(req, res) {
        try {
            const list = await provider_service_1.ProviderService.listProveedores();
            res.json(list);
        }
        catch (err) {
            res.status(500).json({ error: "Error interno" });
        }
    },
    async getById(req, res) {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id))
                return res.status(400).json({ error: "id inválido" });
            const p = await provider_service_1.ProviderService.getProveedorById(id);
            res.json(p);
        }
        catch (err) {
            res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    async update(req, res) {
        try {
            const id = Number(req.params.id);
            const dto = req.body;
            const updated = await provider_service_1.ProviderService.updateProveedor(id, dto);
            res.json(updated);
        }
        catch (err) {
            res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
    async remove(req, res) {
        try {
            const id = Number(req.params.id);
            const deleted = await provider_service_1.ProviderService.deleteProveedor(id);
            res.json({ message: "Proveedor eliminado", deleted });
        }
        catch (err) {
            res.status(err?.status || 500).json({ error: err?.message || "Error interno" });
        }
    },
};
