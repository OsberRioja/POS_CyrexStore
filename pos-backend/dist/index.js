"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = __importDefault(require("./env"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const errorHandler_1 = require("./middlewares/errorHandler");
const prismaClient_1 = require("./prismaClient");
const client_routes_1 = __importDefault(require("./routes/client.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const provider_routes_1 = __importDefault(require("./routes/provider.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const prodcut_routes_1 = __importDefault(require("./routes/prodcut.routes"));
const paymentMethod_routes_1 = __importDefault(require("./routes/paymentMethod.routes"));
const paymentMethod_service_1 = require("./services/paymentMethod.service");
const cashbox_routes_1 = __importDefault(require("./routes/cashbox.routes"));
const sale_routes_1 = __importDefault(require("./routes/sale.routes"));
const expense_routes_1 = __importDefault(require("./routes/expense.routes"));
const stock_routes_1 = __importDefault(require("./routes/stock.routes"));
const return_routes_1 = __importDefault(require("./routes/return.routes"));
const exchangeRate_routes_1 = __importDefault(require("./routes/exchangeRate.routes"));
const userPreference_routes_1 = __importDefault(require("./routes/userPreference.routes"));
const updateExchangeRates_1 = require("./jobs/updateExchangeRates");
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const commission_routes_1 = __importDefault(require("./routes/commission.routes"));
const commissionReport_routes_1 = __importDefault(require("./routes/commissionReport.routes"));
const email_service_1 = require("./services/email.service");
const cleanupExpiredTokens_1 = require("./jobs/cleanupExpiredTokens");
const branch_routes_1 = __importDefault(require("./routes/branch.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const saleEdit_routes_1 = __importDefault(require("./routes/saleEdit.routes"));
const expenseEdit_routes_1 = __importDefault(require("./routes/expenseEdit.routes"));
const receipt_routes_1 = __importDefault(require("./routes/receipt.routes"));
const promotion_routes_1 = __importDefault(require("./routes/promotion.routes"));
const app = (0, express_1.default)();
// ✅ 1. PRIMERO: Middlewares básicos
app.use(express_1.default.json()); // <- DEBE estar ANTES de las rutas
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// ✅ 2. SEGUNDO: Rutas
app.get("/", (req, res) => {
    res.send("Servidor funcionando 🚀");
});
app.get('/health', (_req, res) => res.json({ ok: true }));
// Rutas de API
app.use('/api/users', user_routes_1.default);
app.use('/api/clients', client_routes_1.default);
app.use("/api/providers", provider_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
app.use("/api/products", prodcut_routes_1.default);
app.use("/api/payment-methods", paymentMethod_routes_1.default);
app.use("/api/cashbox", cashbox_routes_1.default);
app.use('/api/sales', sale_routes_1.default);
app.use('/api/expenses', expense_routes_1.default);
app.use('/api/stock', stock_routes_1.default);
app.use('/api/returns', return_routes_1.default);
app.use('/api/exchange-rates', exchangeRate_routes_1.default);
app.use('/api/user-preferences', userPreference_routes_1.default);
app.use('/api/reports', report_routes_1.default);
app.use('/api/commission-config', commission_routes_1.default);
app.use('/api/commission-reports', commissionReport_routes_1.default);
app.use('/api/branches', branch_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/sales-edit', saleEdit_routes_1.default);
app.use('/api/expenses-edit', expenseEdit_routes_1.default);
app.use('/api/receipts', receipt_routes_1.default);
app.use('/api/promotions', promotion_routes_1.default);
// ✅ 3. TERCERO: Error handler (debe estar DESPUÉS de las rutas)
app.use(errorHandler_1.errorHandler);
// ✅ 4. CUARTO: Inicialización y arranque del servidor
(async () => {
    try {
        await paymentMethod_service_1.PaymentMethodService.ensureDefaults();
        console.log("Payment methods defaults ensured");
        await (0, updateExchangeRates_1.initializeExchangeRates)();
        (0, updateExchangeRates_1.startExchangeRateCron)();
        (0, cleanupExpiredTokens_1.startTokenCleanupCron)();
        // Verificación del servicio de email
        await email_service_1.emailService.verifyConnection();
    }
    catch (err) {
        console.warn("Error en Inicializacion:", err);
    }
    // ✅ 5. QUINTO: Arrancar servidor AL FINAL
    const PORT = env_1.default.PORT || 3000;
    const server = app.listen(PORT, () => {
        console.log(`Server listening http://localhost:${PORT}/api`);
        console.log(`Modo: ${env_1.default.NODE_ENV}`);
    });
    // Graceful shutdown
    const shutdown = async () => {
        console.log('Shutting down...');
        await prismaClient_1.prisma.$disconnect();
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception', err);
        shutdown();
    });
    process.on('unhandledRejection', (reason) => {
        console.error('Unhandled Rejection', reason);
        shutdown();
    });
})();
