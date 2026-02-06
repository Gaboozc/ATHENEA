const knex = require('knex');
const config = require('./config');
const logger = require('./utils/logger');

// Knex configuration
const knexConfig = {
  client: 'pg',
  connection: {
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    ssl: config.database.ssl
  },
  pool: config.database.pool,
  migrations: {
    tableName: 'knex_migrations',
    directory: './migrations'
  },
  seeds: {
    directory: './seeds'
  },
  acquireConnectionTimeout: 10000,
  log: {
    warn(message) {
      logger.warn('Database Warning:', message);
    },
    error(message) {
      logger.error('Database Error:', message);
    },
    deprecate(message) {
      logger.warn('Database Deprecation:', message);
    },
    debug(message) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Database Debug:', message);
      }
    }
  }
};

// Create database connection
const db = knex(knexConfig);

// Test database connection
const testConnection = async () => {
  try {
    await db.raw('SELECT NOW()');
    logger.info('✅ Database connection successful');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    return false;
  }
};

// Initialize database connection
const initializeDatabase = async () => {
  const isConnected = await testConnection();
  
  if (!isConnected) {
    throw new Error('Could not connect to database');
  }

  // Run migrations in production
  if (process.env.NODE_ENV === 'production') {
    try {
      await db.migrate.latest();
      logger.info('Database migrations completed successfully');
    } catch (error) {
      logger.error('Database migration failed:', error);
      throw error;
    }
  }

  return db;
};

// Graceful shutdown
const closeDatabase = async () => {
  try {
    await db.destroy();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

// Query helper functions
const dbHelpers = {
  // Paginated query helper
  paginate: async (query, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    
    // Clone query for count
    const countQuery = query.clone().clearSelect().clearOrder().count('* as total').first();
    
    // Execute both queries
    const [data, countResult] = await Promise.all([
      query.limit(limit).offset(offset),
      countQuery
    ]);

    const total = parseInt(countResult?.total || 0);
    const pages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    };
  },

  // Soft delete helper
  softDelete: async (tableName, id, deletedBy = null) => {
    return db(tableName)
      .where('id', id)
      .update({
        deleted_at: new Date(),
        deleted_by: deletedBy,
        updated_at: new Date()
      });
  },

  // Restore soft deleted record
  restore: async (tableName, id) => {
    return db(tableName)
      .where('id', id)
      .update({
        deleted_at: null,
        deleted_by: null,
        updated_at: new Date()
      });
  },

  // Check if record exists
  exists: async (tableName, conditions) => {
    const result = await db(tableName)
      .where(conditions)
      .first();
    return !!result;
  },

  // Get record by ID with error handling
  findById: async (tableName, id, columns = '*') => {
    return db(tableName)
      .select(columns)
      .where('id', id)
      .whereNull('deleted_at')
      .first();
  },

  // Create record with automatic timestamps
  create: async (tableName, data) => {
    const now = new Date();
    const recordData = {
      ...data,
      created_at: now,
      updated_at: now
    };

    const [result] = await db(tableName)
      .insert(recordData)
      .returning('*');

    return result;
  },

  // Update record with automatic timestamps
  update: async (tableName, id, data) => {
    const updateData = {
      ...data,
      updated_at: new Date()
    };

    const [result] = await db(tableName)
      .where('id', id)
      .whereNull('deleted_at')
      .update(updateData)
      .returning('*');

    return result;
  },

  // Transaction wrapper
  transaction: async (callback) => {
    return db.transaction(callback);
  }
};

// Add helpers to db instance
Object.assign(db, dbHelpers);

// Export both the db instance and helper functions
module.exports = db;
module.exports.initializeDatabase = initializeDatabase;
module.exports.closeDatabase = closeDatabase;
module.exports.testConnection = testConnection;