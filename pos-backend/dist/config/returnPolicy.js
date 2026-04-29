"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RETURN_POLICY = void 0;
exports.RETURN_POLICY = {
    maxDaysForReturn: parseInt(process.env.RETURN_MAX_DAYS || '7'),
    requiresApproval: process.env.RETURN_REQUIRES_APPROVAL === 'true',
    allowPartialReturn: process.env.RETURN_ALLOW_PARTIAL === 'true',
    refundMethods: ['CASH', 'CREDIT_NOTE', 'EXCHANGE'],
    requiresReason: true,
    returnToStock: true,
};
