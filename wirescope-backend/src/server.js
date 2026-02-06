const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');
const authMiddleware = require('./middleware/auth');
const validateRequest = require('./middleware/validation');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const floorPlanRoutes = require('./routes/floorPlans');
const pointRoutes = require('./routes/points');
const materialRoutes = require('./routes/materials');
const commRoomRoutes = require('./routes/commRooms');
const hardwareRoutes = require('./routes/hardware');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');

// Import services
const socketService = require('./services/socketService');

const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Initialize Socket Service
socketService.initialize(io);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Compression and parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Rate limiting
if (process.env.ENABLE_RATE_LIMITING === 'true') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: (req) => {
      // Role-based rate limiting
      if (req.user?.role === 'project_manager') return 1000;
      if (req.user?.role === 'supervisor') return 500;
      if (req.user?.role === 'lead_technician') return 200;
      return 100; // technician or unauthenticated
    },
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  app.use(limiter);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
const apiRouter = express.Router();

// Public routes (no authentication required)
apiRouter.use('/auth', authRoutes);

// Protected routes (authentication required)
apiRouter.use('/users', authMiddleware, userRoutes);
apiRouter.use('/projects', authMiddleware, projectRoutes);
apiRouter.use('/floor-plans', authMiddleware, floorPlanRoutes);
apiRouter.use('/points', authMiddleware, pointRoutes);
apiRouter.use('/materials', authMiddleware, materialRoutes);
apiRouter.use('/comm-rooms', authMiddleware, commRoomRoutes);
apiRouter.use('/hardware', authMiddleware, hardwareRoutes);
apiRouter.use('/notifications', authMiddleware, notificationRoutes);
apiRouter.use('/reports', authMiddleware, reportRoutes);

// Mount API router
app.use(`/api/${config.api.version}`, apiRouter);

// Swagger documentation
if (process.env.ENABLE_SWAGGER_DOCS === 'true' && process.env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerDocument = require('./swagger.json');
  
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customSiteTitle: 'WireScope API Documentation',
    customCss: '.swagger-ui .topbar { display: none }'
  }));
}

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed.');
    
    // Close database connections
    const db = require('./database');
    db.destroy().then(() => {
      logger.info('Database connections closed.');
      process.exit(0);
    }).catch((err) => {
      logger.error('Error closing database connections:', err);
      process.exit(1);
    });
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = { app, server };

// Start server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    logger.info(`🚀 WireScope API Server is running on port ${PORT}`);
    logger.info(`📖 Environment: ${process.env.NODE_ENV || 'development'}`);
    if (process.env.ENABLE_SWAGGER_DOCS === 'true') {
      logger.info(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
    }
  });
}