"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchController = void 0;
const branch_service_1 = require("../services/branch.service");
const createBranch_dto_1 = require("../dtos/createBranch.dto");
const updateBranch_dto_1 = require("../dtos/updateBranch.dto");
class BranchController {
    constructor() {
        this.getAllBranches = async (req, res) => {
            try {
                const branches = await this.branchService.getAllBranches();
                res.json(branches);
            }
            catch (error) {
                res.status(error.status || 500).json({ message: error.message });
            }
        };
        this.getBranchById = async (req, res) => {
            try {
                const branch = await this.branchService.getBranchById(Number(req.params.id));
                res.json(branch);
            }
            catch (error) {
                res.status(error.status || 500).json({ message: error.message });
            }
        };
        this.createBranch = async (req, res) => {
            try {
                const validatedData = createBranch_dto_1.CreateBranchSchema.parse(req.body);
                const branch = await this.branchService.createBranch(validatedData);
                res.status(201).json(branch);
            }
            catch (error) {
                if (error.name === 'ZodError') {
                    res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
                }
                else {
                    res.status(error.status || 500).json({ message: error.message });
                }
            }
        };
        this.updateBranch = async (req, res) => {
            try {
                const validatedData = updateBranch_dto_1.UpdateBranchSchema.parse(req.body);
                const branch = await this.branchService.updateBranch(Number(req.params.id), validatedData);
                res.json(branch);
            }
            catch (error) {
                if (error.name === 'ZodError') {
                    res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
                }
                else {
                    res.status(error.status || 500).json({ message: error.message });
                }
            }
        };
        this.deleteBranch = async (req, res) => {
            try {
                await this.branchService.deleteBranch(Number(req.params.id));
                res.status(204).send();
            }
            catch (error) {
                res.status(error.status || 500).json({ message: error.message });
            }
        };
        this.branchService = new branch_service_1.BranchService();
    }
}
exports.BranchController = BranchController;
