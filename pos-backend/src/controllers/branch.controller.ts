import { Request, Response } from 'express';
import { BranchService } from '../services/branch.service';
import { CreateBranchSchema } from '../dtos/createBranch.dto';
import { UpdateBranchSchema } from '../dtos/updateBranch.dto';

export class BranchController {
  private branchService: BranchService;

  constructor() {
    this.branchService = new BranchService();
  }

  getAllBranches = async (req: Request, res: Response) => {
    try {
      const branches = await this.branchService.getAllBranches();
      res.json(branches);
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message });
    }
  };

  getBranchById = async (req: Request, res: Response) => {
    try {
      const branch = await this.branchService.getBranchById(Number(req.params.id));
      res.json(branch);
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message });
    }
  };

  createBranch = async (req: Request, res: Response) => {
    try {
      const validatedData = CreateBranchSchema.parse(req.body);
      const branch = await this.branchService.createBranch(validatedData);
      res.status(201).json(branch);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
      } else {
        res.status(error.status || 500).json({ message: error.message });
      }
    }
  };

  updateBranch = async (req: Request, res: Response) => {
    try {
      const validatedData = UpdateBranchSchema.parse(req.body);
      const branch = await this.branchService.updateBranch(Number(req.params.id), validatedData);
      res.json(branch);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
      } else {
        res.status(error.status || 500).json({ message: error.message });
      }
    }
  };

  deleteBranch = async (req: Request, res: Response) => {
    try {
      await this.branchService.deleteBranch(Number(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message });
    }
  };
}