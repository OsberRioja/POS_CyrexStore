"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionController = void 0;
const promotion_service_1 = require("../services/promotion.service");
exports.PromotionController = {
    async list(_req, res) { try {
        res.json(await promotion_service_1.PromotionService.list());
    }
    catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || 'Error interno' });
    } },
    async get(req, res) { try {
        const item = await promotion_service_1.PromotionService.get(req.params.id);
        if (!item)
            return res.status(404).json({ error: 'No encontrada' });
        res.json(item);
    }
    catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || 'Error interno' });
    } },
    async create(req, res) { try {
        res.status(201).json(await promotion_service_1.PromotionService.create(req.body));
    }
    catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || 'Error interno' });
    } },
    async update(req, res) { try {
        res.json(await promotion_service_1.PromotionService.update(req.params.id, req.body));
    }
    catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || 'Error interno' });
    } },
    async remove(req, res) { try {
        await promotion_service_1.PromotionService.remove(req.params.id);
        res.json({ ok: true });
    }
    catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || 'Error interno' });
    } }
};
