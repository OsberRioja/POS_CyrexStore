import { Request, Response } from "express";
import { ExpenseEditService } from "../services/expenseEdit.service";

export const ExpenseEditController = {
    async update(req: Request, res: Response) {
        try {
            const expenseId = Number(req.params.id);
            const dto = req.body;
            const userId = (req as any).userId ?? (req as any).user?.sub;

            if (!userId) {
                return res.status(401).json({ error: "Usuario no autenticado" });
            }

            // Obtener branchId del usuario autenticado
            const userBranchId = (req as any).user?.branchId;
            let targetBranchId = userBranchId;

            // Si es admin global, buscar branchId en body o query
            if (!targetBranchId) {
                targetBranchId = req.body.branchId || (req.query.branchId ? Number(req.query.branchId) : undefined);

                if (!targetBranchId) {
                    return res.status(400).json({
                        error: "Para usuarios administradores, debe especificar una sucursal"
                    });
                }
            }

            const updatedExpense = await ExpenseEditService.updateExpense(
                expenseId,
                dto,
                String(userId),
                targetBranchId
            );

            return res.json({
                success: true,
                message: "Gasto actualizado correctamente",
                data: updatedExpense
            });
        } catch (err: any) {
            console.error("PUT /expenses-edit/:id", err);
            return res.status(err?.status || 500).json({
                error: err?.message || "Error interno"
            });
        }
    }
};