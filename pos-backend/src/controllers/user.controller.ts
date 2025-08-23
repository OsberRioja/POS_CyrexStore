import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import type { CreateUserDTO } from "../dtos/createUser.dto";

export const UserController = {
  async create(req: Request, res: Response) {
    try {
      const dto: CreateUserDTO = req.body;
      const user = await UserService.createUser(dto);
      return res.status(201).json(user);
    } catch (err: any) {
      const status = err?.status || 500;
      return res.status(status).json({ error: err?.message || "Internal error" });
    }
  }
};
