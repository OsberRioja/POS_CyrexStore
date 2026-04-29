"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchService = void 0;
const branch_repository_1 = require("../repositories/branch.repository");
class BranchService {
    constructor() {
        this.branchRepository = new branch_repository_1.BranchRepository();
    }
    async getAllBranches() {
        return this.branchRepository.findAll();
    }
    async getBranchById(id) {
        const branch = await this.branchRepository.findById(id);
        if (!branch) {
            throw { status: 404, message: 'Sucursal no encontrada' };
        }
        return branch;
    }
    async createBranch(data) {
        // Validar que el nombre sea único
        const existingBranch = await this.branchRepository.findAll();
        if (existingBranch.some(branch => branch.name.toLowerCase() === data.name.toLowerCase())) {
            throw { status: 400, message: 'Ya existe una sucursal con ese nombre' };
        }
        return this.branchRepository.create(data);
    }
    async updateBranch(id, data) {
        await this.getBranchById(id); // Verificar que existe
        if (data.name) {
            const existingBranches = await this.branchRepository.findAll();
            if (existingBranches.some(branch => branch.name.toLowerCase() === data.name.toLowerCase() && branch.id !== id)) {
                throw { status: 400, message: 'Ya existe una sucursal con ese nombre' };
            }
        }
        return this.branchRepository.update(id, data);
    }
    async deleteBranch(id) {
        await this.getBranchById(id);
        return this.branchRepository.delete(id);
    }
}
exports.BranchService = BranchService;
