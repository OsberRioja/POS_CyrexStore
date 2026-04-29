"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTextField = void 0;
const normalizeTextField = (value) => {
    if (typeof value !== 'string')
        return undefined;
    const collapsed = value
        .trim()
        .replace(/\s+/g, ' ');
    if (!collapsed)
        return undefined;
    return collapsed
        .toLocaleLowerCase('es-BO')
        .replace(/\b\p{L}/gu, (ch) => ch.toLocaleUpperCase('es-BO'));
};
exports.normalizeTextField = normalizeTextField;
