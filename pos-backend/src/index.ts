import env from './env';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler';
import { prisma } from './prismaClient';
import clientRoutes from './routes/client.routes';
import userRoutes from './routes/user.routes';
import providerRoutes from "./routes/provider.routes";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/prodcut.routes";
import PaymentMethodRoutes from "./routes/paymentMethod.routes";
import { PaymentMethodService } from "./services/paymentMethod.service";
import cashBoxRoutes from "./routes/cashbox.routes";
import salesRoutes from "./routes/sale.routes";
import expenseRoutes from "./routes/expense.routes";
import stockRoutes from "./routes/stock.routes";
import returnRoutes from "./routes/return.routes";
import exchangeRateRoutes from './routes/exchangeRate.routes';
import userPreferenceRoutes from './routes/userPreference.routes';
import { startExchangeRateCron, initializeExchangeRates } from './jobs/updateExchangeRates';
import reportRoutes from './routes/report.routes';
import commissionRoutes from './routes/commission.routes';
import commissionReportRoutes from './routes/commissionReport.routes';

const app = express();

// ✅ 1. PRIMERO: Middlewares básicos
app.use(express.json()); // <- DEBE estar ANTES de las rutas
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

// ✅ 2. SEGUNDO: Rutas
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});

app.get('/health', (_req, res) => res.json({ ok: true }));

// Rutas de API
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/payment-methods", PaymentMethodRoutes);
app.use("/api/cashbox", cashBoxRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/exchange-rates', exchangeRateRoutes);
app.use('/api/user-preferences', userPreferenceRoutes);
app.use('/api/reports',reportRoutes);
app.use('/api/commission-config', commissionRoutes);
app.use('/api/commission-reports', commissionReportRoutes);

// ✅ 3. TERCERO: Error handler (debe estar DESPUÉS de las rutas)
app.use(errorHandler);

// ✅ 4. CUARTO: Inicialización y arranque del servidor
(async () => {
  try {
    await PaymentMethodService.ensureDefaults();
    console.log("Payment methods defaults ensured");
    await initializeExchangeRates();
    startExchangeRateCron();
  } catch (err) {
    console.warn("Error en Inicializacion:", err);
  }

  // ✅ 5. QUINTO: Arrancar servidor AL FINAL
  const PORT = env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`Server listening http://localhost:${PORT}/api`);
    console.log(`Modo: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...');
    await prisma.$disconnect();
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