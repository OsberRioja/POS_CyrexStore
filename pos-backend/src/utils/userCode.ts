import { prisma } from "../prismaClient";

export async function generateUniqueUsercode(maxAttempts = 10): Promise<number> {
  // intentar generar candidatos aleatorios primero (lógica previa)
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = Math.floor(1000 + Math.random() * 9000);
    const exists = await prisma.user.findUnique({ where: { userCode: candidate } });
    if (!exists) return candidate;
  }

  // fallback: obtener el mayor usercode existente (asegurándonos de que no sea null)
  const highest = await prisma.user.findMany({
    where: { userCode: { not: null } },          // filtra usercode null
    orderBy: { userCode: "desc" },
    take: 1,
    select: { userCode: true },
  });

  let next: number;
  if (highest.length > 0 && highest[0].userCode != null) {
    // highest[0].usercode es seguro y no-null aquí
    next = highest[0].userCode + 1;
  } else {
    next = 1000;
  }

  // mantenerlo dentro de 4 dígitos (1000..9999)
  if (next > 9999) next = 1000;

  // Asegurarnos que no exista (si existe, el caller reintentará o manejamos P2002)
  const existsFinal = await prisma.user.findUnique({ where: { userCode: next } });
  if (!existsFinal) return next;

  // si colisiona (muy improbable), incrementamos hasta encontrar uno libre
  for (let i = 0; i < 9000; i++) {
    next++;
    if (next > 9999) next = 1000;
    const e = await prisma.user.findUnique({ where: { userCode: next } });
    if (!e) return next;
  }

  throw new Error("No se pudo generar un usercode único");
}
