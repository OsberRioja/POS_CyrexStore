"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
exports.UserController = {
    async create(req, res) {
        try {
            const dto = req.body;
            console.log('🔍 UserController.create - Body recibido:', dto);
            console.log('🔍 UserController.create - Headers:', req.headers);
            console.log('🔍 UserController.create - User del token:', req.user);
            // Obtener branchId del usuario autenticado
            const currentUserBranchId = req.user?.branchId;
            console.log('🔍 UserController.create - currentUserBranchId:', currentUserBranchId);
            const user = await user_service_1.UserService.createUser(dto, currentUserBranchId);
            return res.status(201).json(user);
        }
        catch (err) {
            const status = err?.status || 500;
            return res.status(status).json({ error: err?.message || "Internal error" });
        }
    },
    async list(req, res) {
        try {
            const currentUserBranchId = req.user?.branchId;
            const queryBranchId = req.query.branchId ? Number(req.query.branchId) : undefined;
            const includeAllBranches = req.query.allBranches === 'true';
            const users = await user_service_1.UserService.listUsers(currentUserBranchId, queryBranchId, includeAllBranches);
            return res.json(users);
        }
        catch (err) {
            return res.status(500).json({ error: "Error al listar usuarios" });
        }
    },
    async getOne(req, res) {
        try {
            const user = await user_service_1.UserService.getUserById(req.params.id);
            return res.json(user);
        }
        catch (err) {
            return res.status(err.status || 500).json({ error: err.message || "Error interno" });
        }
    },
    async getByUserCode(req, res) {
        try {
            const user = await user_service_1.UserService.getByUserCode(Number(req.params.usercode));
            return res.json(user);
        }
        catch (err) {
            return res.status(err.status || 500).json({ error: err.message || "Error interno" });
        }
    },
    async getByEmail(req, res) {
        try {
            const user = await user_service_1.UserService.getByEmail(req.params.email);
            return res.json(user);
        }
        catch (err) {
            return res.status(err.status || 500).json({ error: err.message || "Error interno" });
        }
    },
    async getByName(req, res) {
        try {
            const user = await user_service_1.UserService.getByName(req.params.name);
            return res.json(user);
        }
        catch (err) {
            return res.status(err.status || 500).json({ error: err.message || "Error interno" });
        }
    },
    async updateUser(req, res) {
        try {
            const id = req.params.id;
            const data = req.body;
            const updatedUser = await user_service_1.UserService.updateUser(id, data);
            return res.json(updatedUser);
        }
        catch (err) {
            return res.status(err.status || 500).json({ error: err.message || "Error interno" });
        }
    },
    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const deletedUser = await user_service_1.UserService.deleteUser(id);
            res.status(200).json({ message: "Usuario eliminado correctamente", deletedUser });
        }
        catch (error) {
            res.status(error.status || 500).json({ message: error.message || "Error al eliminar usuario" });
        }
    },
};
