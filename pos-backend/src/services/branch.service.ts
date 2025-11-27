import { BranchRepository } from '../repositories/branch.repository';
import { CreateBranchDTO } from '../dtos/createBranch.dto';
import { UpdateBranchDTO } from '../dtos/updateBranch.dto';

export class BranchService {
  private branchRepository: BranchRepository;

  constructor() {
    this.branchRepository = new BranchRepository();
  }

  async getAllBranches() {
    return this.branchRepository.findAll();
  }

  async getBranchById(id: number) {
    const branch = await this.branchRepository.findById(id);
    if (!branch) {
      throw { status: 404, message: 'Sucursal no encontrada' };
    }
    return branch;
  }

  async createBranch(data: CreateBranchDTO) {
    // Validar que el nombre sea único
    const existingBranch = await this.branchRepository.findAll();
    if (existingBranch.some(branch => branch.name.toLowerCase() === data.name.toLowerCase())) {
      throw { status: 400, message: 'Ya existe una sucursal con ese nombre' };
    }

    return this.branchRepository.create(data);
  }

  async updateBranch(id: number, data: UpdateBranchDTO) {
    await this.getBranchById(id); // Verificar que existe
    
    if (data.name) {
      const existingBranches = await this.branchRepository.findAll();
      if (existingBranches.some(branch => branch.name.toLowerCase() === (data.name as string).toLowerCase() && branch.id !== id)) {
        throw { status: 400, message: 'Ya existe una sucursal con ese nombre' };
      }
    }

    return this.branchRepository.update(id, data);
  }

  async deleteBranch(id: number) {
    await this.getBranchById(id);
    return this.branchRepository.delete(id);
  }
}