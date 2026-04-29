"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHONE_MAX_LENGTH = exports.PHONE_MIN_LENGTH = void 0;
exports.normalizePhoneNumber = normalizePhoneNumber;
exports.normalizeCountryCode = normalizeCountryCode;
exports.buildWhatsAppPhone = buildWhatsAppPhone;
exports.validatePhoneOrThrow = validatePhoneOrThrow;
exports.PHONE_MIN_LENGTH = 7;
exports.PHONE_MAX_LENGTH = 10;
function normalizePhoneNumber(input) {
    if (input === null || input === undefined)
        return "";
    return String(input).replace(/[^0-9]/g, "");
}
function normalizeCountryCode(input) {
    if (input === null || input === undefined)
        return "";
    return String(input).replace(/[^0-9]/g, "");
}
function buildWhatsAppPhone(countryCode, phone) {
    return `${normalizeCountryCode(countryCode)}${normalizePhoneNumber(phone)}`;
}
function validatePhoneOrThrow(phone, countryCode, country) {
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
    if (normalizedPhone.length < exports.PHONE_MIN_LENGTH || normalizedPhone.length > exports.PHONE_MAX_LENGTH) {
        throw { status: 400, message: `phone debe tener entre ${exports.PHONE_MIN_LENGTH} y ${exports.PHONE_MAX_LENGTH} dígitos` };
    }
}
