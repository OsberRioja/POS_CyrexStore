export const normalizeTextField = (value?: string | null): string | undefined => {
  if (typeof value !== 'string') return undefined;

  const collapsed = value
    .trim()
    .replace(/\s+/g, ' ');

  if (!collapsed) return undefined;

  return collapsed
    .toLocaleLowerCase('es-BO')
    .replace(/\b\p{L}/gu, (ch) => ch.toLocaleUpperCase('es-BO'));
};
