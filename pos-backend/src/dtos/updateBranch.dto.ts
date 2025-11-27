import { z } from 'zod';

export const UpdateBranchSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateBranchDTO = z.infer<typeof UpdateBranchSchema>;