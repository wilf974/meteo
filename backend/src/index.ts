import 'reflect-metadata';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { AppDataSource } from './config/database';
import { redisClient } from './config/redis';
import { logger } from './utils/logger';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { initializeSchedulers } from './schedulers/daily-report.scheduler';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Routes
app.use(`/api/${process.env.API_VERSION || 'v1'}`, routes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// WebSocket
io.on('connection', (socket) => {
  logger.info(`Client connecté: ${socket.id}`);

  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    logger.info(`Socket ${socket.id} a rejoint la room ${roomId}`);
  });

  socket.on('leave-room', (roomId: string) => {
    socket.leave(roomId);
    logger.info(`Socket ${socket.id} a quitté la room ${roomId}`);
  });

  socket.on('map-annotation', (data) => {
    socket.to(data.roomId).emit('map-annotation', data);
  });

  socket.on('cursor-move', (data) => {
    socket.to(data.roomId).emit('cursor-move', {
      userId: socket.id,
      position: data.position
    });
  });

  socket.on('disconnect', () => {
    logger.info(`Client déconnecté: ${socket.id}`);
  });
});

// Store io instance for use in other modules
export { io };

// Initialize database and start server
const startServer = async () => {
  try {
    // Connexion à PostgreSQL
    await AppDataSource.initialize();
    logger.info('✅ Base de données PostgreSQL connectée');

    // Connexion à Redis
    await redisClient.connect();
    logger.info('✅ Redis connecté');

    // Initialize schedulers for daily reports
    initializeSchedulers();
    logger.info('✅ Schedulers initialized');

    // Démarrage du serveur
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Serveur démarré sur le port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
    });
  } catch (error) {
    logger.error('❌ Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM reçu, fermeture gracieuse...');
  httpServer.close(async () => {
    await AppDataSource.destroy();
    await redisClient.quit();
    process.exit(0);
  });
});

startServer();

export default app;
