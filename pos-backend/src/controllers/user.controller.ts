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
  },
  async list(req: Request, res: Response) {
      try {
        const users = await UserService.listUsers();
        return res.json(users);
      } catch (err: any) {
        return res.status(500).json({ error: "Error al listar usuarios" });
      }
    },
    async getOne(req: Request, res: Response) {
      try {
        const user = await UserService.getUserById(req.params.id);
        return res.json(user);
      } catch (err: any) {
        return res.status(err.status || 500).json({ error: err.message || "Error interno" });
      }
    },

    async getByUserCode(req: Request, res: Response) {
      try {
        const user = await UserService.getByUserCode(Number(req.params.usercode));
        return res.json(user);
      } catch (err: any) {
        return res.status(err.status || 500).json({ error: err.message || "Error interno" });
      }
    },

    async getByEmail(req: Request, res: Response) {
      try {
        const user = await UserService.getByEmail(req.params.email);
        return res.json(user);
      } catch (err: any) {
        return res.status(err.status || 500).json({ error: err.message || "Error interno" });
      }
    },

    async getByName(req: Request, res: Response) {
      try {
        const user = await UserService.getByName(req.params.name);
        return res.json(user);
      } catch (err: any) {
        return res.status(err.status || 500).json({ error: err.message || "Error interno" });
      }
    },

    async updateUser(req: Request, res: Response) {
      try {
        const id = req.params.id;
        const data: {
          username?: string;
          password?: string;
          email?: string;
          phone?: string;
          role?: "ADMIN" | "SUPERVISOR" | "SELLER";
        } = req.body;

        const updatedUser = await UserService.updateUser(id, data);
        return res.json(updatedUser);
      } catch (err: any) {
        return res.status(err.status || 500).json({ error: err.message || "Error interno" });
      }
    },

    async deleteUser(req: Request, res: Response) {
        try {
          const { id } = req.params;
          const deletedUser = await UserService.deleteUser(id);
          res.status(200).json({ message: "Usuario eliminado correctamente", deletedUser });
        } catch (error: any) {
          res.status(error.status || 500).json({ message: error.message || "Error al eliminar usuario" });
        }
    }

};
