"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = exports.getById = exports.approve = exports.create = void 0;
const return_service_1 = require("../services/return.service");
const return_dto_1 = require("../dtos/return.dto");
const create = async (req, res) => {
    try {
        const dto = return_dto_1.CreateReturnDTO.parse(req.body);
        const userId = req.userId;
        const result = await return_service_1.ReturnService.createReturn(dto, userId);
        return res.status(201).json(result);
    }
    catch (error) {
        if (error.issues) {
            return res.status(400).json({ error: error.issues });
        }
        return res.status(error.status || 500).json({ error: error.message || "Error interno" });
    }
};
exports.create = create;
const approve = async (req, res) => {
    try {
        const returnId = Number(req.params.id);
        const userId = req.userId;
        const result = await return_service_1.ReturnService.approveReturn(returnId, userId);
        return res.json(result);
    }
    catch (error) {
        return res.status(error.status || 500).json({ error: error.message || "Error interno" });
    }
};
exports.approve = approve;
const getById = async (req, res) => {
    try {
        const returnId = Number(req.params.id);
        const result = await return_service_1.ReturnService.getReturnById(returnId);
        return res.json(result);
    }
    catch (error) {
        return res.status(error.status || 500).json({ error: error.message || "Error interno" });
    }
};
exports.getById = getById;
const list = async (req, res) => {
    try {
        const page = req.query.page ? Number(req.query.page) : undefined;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const saleId = req.query.saleId;
        const result = await return_service_1.ReturnService.listReturns({ page, limit, saleId });
        return res.json(result);
    }
    catch (error) {
        return res.status(error.status || 500).json({ error: error.message || "Error interno" });
    }
};
exports.list = list;
