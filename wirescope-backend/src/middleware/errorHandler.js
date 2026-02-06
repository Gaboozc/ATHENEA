const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.logError(err, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    body: req.body,
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      message,
      statusCode: 404,
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = {
      message,
      statusCode: 400,
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = {
      message: message.join(', '),
      statusCode: 400,
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again.';
    error = {
      message,
      statusCode: 401,
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired. Please log in again.';
    error = {
      message,
      statusCode: 401,
    };
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED') {
    const message = 'Database connection failed';
    error = {
      message,
      statusCode: 500,
    };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = {
      message,
      statusCode: 413,
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = {
      message,
      statusCode: 400,
    };
  }

  // Auth0 errors
  if (err.statusCode === 401 && err.code === 'credentials_required') {
    error = {
      message: 'No authorization token was found',
      statusCode: 401,
    };
  }

  if (err.statusCode === 401 && err.code === 'invalid_token') {
    error = {
      message: 'Invalid token provided',
      statusCode: 401,
    };
  }

  // Express validation errors
  if (err.type === 'entity.parse.failed') {
    error = {
      message: 'Invalid JSON format',
      statusCode: 400,
    };
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    error = {
      message: 'Too many requests, please try again later',
      statusCode: 429,
    };
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: message,
    },
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown',
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = error.details;
  }

  // Include validation errors if present
  if (error.errors) {
    errorResponse.error.validationErrors = error.errors;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;