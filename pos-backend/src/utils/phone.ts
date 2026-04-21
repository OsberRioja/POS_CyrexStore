export const PHONE_MIN_LENGTH = 7;
export const PHONE_MAX_LENGTH = 10;

export function normalizePhoneNumber(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  return String(input).replace(/[^0-9]/g, "");
}

export function normalizeCountryCode(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  return String(input).replace(/[^0-9]/g, "");
}

export function buildWhatsAppPhone(countryCode: string, phone: string): string {
  return `${normalizeCountryCode(countryCode)}${normalizePhoneNumber(phone)}`;
}

export function validatePhoneOrThrow(phone: string, countryCode: string, country: string): void {
  if (!countryCode || !country) {
    throw { status: 400, message: "countryCode y country son obligatorios" };
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) {
    throw { status: 400, message: "phone es obligatorio" };
  }

  if (!/^\d+$/.test(normalizedPhone)) {
    throw { status: 400, message: "phone debe contener solo números" };
  }

  if (normalizedPhone.length < PHONE_MIN_LENGTH || normalizedPhone.length > PHONE_MAX_LENGTH) {
    throw { status: 400, message: `phone debe tener entre ${PHONE_MIN_LENGTH} y ${PHONE_MAX_LENGTH} dígitos` };
  }
}
