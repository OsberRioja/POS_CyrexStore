// src/types/prisma-client.d.ts
import { Prisma } from "@prisma/client";

declare module "@prisma/client" {
  interface PrismaClient {
    $use: (cb: (params: any, next: (params: any) => any) => any) => void;
  }
}
