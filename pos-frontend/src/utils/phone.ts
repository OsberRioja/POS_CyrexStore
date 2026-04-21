export const PHONE_MIN_LENGTH = 7;
export const PHONE_MAX_LENGTH = 10;

export const PHONE_COUNTRIES = [
  { name: 'Bolivia', code: '591' },
  { name: 'Argentina', code: '54' },
  { name: 'Chile', code: '56' },
  { name: 'Perú', code: '51' },
  { name: 'Paraguay', code: '595' },
];

export function normalizePhoneNumber(input: string | null | undefined): string {
  return (input ?? '').replace(/[^0-9]/g, '');
}

export function normalizeCountryCode(input: string | null | undefined): string {
  return (input ?? '').replace(/[^0-9]/g, '');
}

export function buildWhatsAppPhone(countryCode: string, phone: string): string {
  return `${normalizeCountryCode(countryCode)}${normalizePhoneNumber(phone)}`;
}

export function validatePhoneInput(phone: string): string | null {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return 'El teléfono es obligatorio';
  if (normalized.length < PHONE_MIN_LENGTH || normalized.length > PHONE_MAX_LENGTH) {
    return `El teléfono debe tener entre ${PHONE_MIN_LENGTH} y ${PHONE_MAX_LENGTH} dígitos`;
  }
  return null;
}
