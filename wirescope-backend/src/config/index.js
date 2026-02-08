require('dotenv').config();

const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || 'development'
  },

  // API configuration
  api: {
    version: process.env.API_VERSION || 'v1',
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000'
  },

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'ATHENEA_dev',
    user: process.env.DB_USER || 'ATHENEA_user',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true',
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    }
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
  },

  // Auth0 configuration
  auth0: {
    domain: process.env.AUTH0_DOMAIN,
    audience: process.env.AUTH0_AUDIENCE,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiration: process.env.JWT_EXPIRATION || '24h',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    issuer: 'ATHENEA-api',
    algorithm: 'HS256'
  },

  // AWS S3 configuration
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3: {
      bucket: process.env.AWS_S3_BUCKET || 'ATHENEA-files',
      cloudFrontUrl: process.env.AWS_CLOUDFRONT_URL,
    }
  },

  // Firebase configuration
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    clientId: process.env.FIREBASE_CLIENT_ID,
    authUri: process.env.FIREBASE_AUTH_URI,
    tokenUri: process.env.FIREBASE_TOKEN_URI,
  },

  // Email configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    from: process.env.EMAIL_FROM || 'noreply@ATHENEA.com',
  },

  // Application URLs
  urls: {
    client: process.env.CLIENT_URL || 'http://localhost:3001',
    admin: process.env.ADMIN_URL || 'http://localhost:3002',
    api: process.env.API_BASE_URL || 'http://localhost:3000',
  },

  // Security configuration
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'fallback-session-secret',
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // File upload limits
  upload: {
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB) || 50,
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['pdf', 'jpg', 'jpeg', 'png', 'gif'],
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filename: 'logs/ATHENEA.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
    timestamp: true,
  },

  // Feature flags
  features: {
    enableSwaggerDocs: process.env.ENABLE_SWAGGER_DOCS === 'true',
    enableWebsockets: process.env.ENABLE_WEBSOCKETS === 'true',
    enableRateLimiting: process.env.ENABLE_RATE_LIMITING === 'true',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true',
  },

  // External APIs
  externalApis: {
    weatherApiKey: process.env.WEATHER_API_KEY,
    mapsApiKey: process.env.MAPS_API_KEY,
    sentryDsn: process.env.SENTRY_DSN,
  },

  // Role hierarchy for permissions
  roles: {
    TECHNICIAN: 1,
    LEAD_TECHNICIAN: 2,
    SUPERVISOR: 3,
    PROJECT_MANAGER: 4,
  },

  // Point status workflow
  pointStatuses: {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    PULL: 'pull',
    TERMINATED: 'terminated',
    CERTIFIED: 'certified',
    PROBLEMS: 'problems',
    MATERIAL_PENDING: 'material_pending',
  },

  // Project statuses
  projectStatuses: {
    PLANNING: 'planning',
    ACTIVE: 'active',
    ON_HOLD: 'on_hold',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  // Notification types
  notificationTypes: {
    PROJECT_UPDATE: 'project_update',
    APPROVAL_REQUEST: 'approval_request',
    MATERIAL_SHORTAGE: 'material_shortage',
    DEADLINE_ALERT: 'deadline_alert',
    SYSTEM_MESSAGE: 'system_message',
  },

  // Default pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },

  // Cache TTL (in seconds)
  cacheTtl: {
    short: 300,    // 5 minutes
    medium: 1800,  // 30 minutes
    long: 3600,    // 1 hour
    daily: 86400,  // 24 hours
  },
};

// Validation
const requiredEnvVars = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
];

if (process.env.NODE_ENV === 'production') {
  requiredEnvVars.push(
    'AUTH0_DOMAIN',
    'AUTH0_AUDIENCE',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET',
  );
}

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

module.exports = config;