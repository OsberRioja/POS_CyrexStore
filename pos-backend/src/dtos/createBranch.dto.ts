import { z } from 'zod';

export const CreateBranchSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export type CreateBranchDTO = z.infer<typeof CreateBranchSchema>;