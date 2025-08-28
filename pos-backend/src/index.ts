import 'dotenv/config'; // carga variables de entorno desde .env
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
//import router from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { prisma } from './prismaClient';
import clientRoutes from './routes/client.routes';
import userRoutes from './routes/user.routes';
import providerRoutes from "./routes/provider.routes";

const app = express();
app.use(express.json()); // <- necesario para parsear JSON

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// prefijo API
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use("/api/providers", providerRoutes);

// healthcheck
app.get('/health', (_req, res) => res.json({ ok: true }));

// error handler (al final)
app.use(errorHandler);

// arrancar servidor
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server listening http://localhost:${PORT}/api`);
});

// Graceful shutdown: desconectar Prisma al cerrar el proceso
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
