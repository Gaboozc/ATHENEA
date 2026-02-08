const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const config = require('../config');
const logger = require('../utils/logger');

// JWKS client for Auth0
const client = jwksClient({
  jwksUri: `https://${config.auth0.domain}/.well-known/jwks.json`,
  requestHeaders: {}, // Optional
  timeout: 30000, // Defaults to 30s
});

// Get signing key for Auth0 JWT
const getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key?.publicKey || key?.rsaPublicKey;
    callback(null, signingKey);
  });
};

// Verify Auth0 JWT token
const verifyAuth0Token = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      audience: config.auth0.audience,
      issuer: `https://${config.auth0.domain}/`,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

// Verify internal JWT token
const verifyInternalToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      algorithms: [config.jwt.algorithm]
    }, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

// Main authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access token is required'
        }
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Token must be in Bearer format'
        }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    let decoded;
    
    try {
      // Try Auth0 token first (for production)
      if (config.auth0.domain && process.env.NODE_ENV === 'production') {
        decoded = await verifyAuth0Token(token);
      } else {
        // Fallback to internal JWT (for development)
        decoded = await verifyInternalToken(token);
      }
    } catch (tokenError) {
      logger.logSecurity('INVALID_TOKEN_ATTEMPT', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        token: token.substring(0, 10) + '...',
        error: tokenError.message
      });

      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      });
    }

    // Extract user information from token
    const user = {
      id: decoded.sub || decoded.userId,
      email: decoded.email,
      role: decoded.role || decoded['https://ATHENEA.com/role'],
      permissions: decoded.permissions || decoded['https://ATHENEA.com/permissions'] || [],
      exp: decoded.exp,
      iat: decoded.iat
    };

    // Validate required user fields
    if (!user.id || !user.email || !user.role) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_CLAIMS',
          message: 'Token is missing required claims'
        }
      });
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (user.exp && user.exp < now) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired'
        }
      });
    }

    // Attach user to request
    req.user = user;
    req.token = token;

    // Log successful authentication
    logger.logAuth('TOKEN_VERIFIED', user.id, {
      role: user.role,
      ip: req.ip,
      endpoint: req.path
    });

    next();
  } catch (error) {
    logger.logError(error, {
      middleware: 'authMiddleware',
      url: req.url,
      method: req.method
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error occurred'
      }
    });
  }
};

// Role-based authorization middleware
const requireRole = (minRole) => {
  const roleHierarchy = {
    'technician': 1,
    'lead_technician': 2,
    'supervisor': 3,
    'project_manager': 4
  };

  return (req, res, next) => {
    const userRoleLevel = roleHierarchy[req.user?.role] || 0;
    const requiredRoleLevel = roleHierarchy[minRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      logger.logSecurity('UNAUTHORIZED_ACCESS_ATTEMPT', {
        userId: req.user?.id,
        userRole: req.user?.role,
        requiredRole: minRole,
        endpoint: req.path,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to access this resource'
        }
      });
    }

    next();
  };
};

// Permission-based authorization middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user?.permissions?.includes(permission)) {
      logger.logSecurity('PERMISSION_DENIED', {
        userId: req.user?.id,
        requiredPermission: permission,
        userPermissions: req.user?.permissions,
        endpoint: req.path,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have the required permission for this action'
        }
      });
    }

    next();
  };
};

// Project access middleware (check if user has access to specific project)
const requireProjectAccess = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.projectId;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PROJECT_ID_REQUIRED',
          message: 'Project ID is required'
        }
      });
    }

    // Project managers and supervisors have access to all projects
    if (['project_manager', 'supervisor'].includes(req.user.role)) {
      return next();
    }

    // For technicians and lead technicians, check project assignment
    // This would require a database query to check project_team table
    const db = require('../database');
    const projectAccess = await db('project_team')
      .where({
        project_id: projectId,
        user_id: req.user.id,
        removed_at: null
      })
      .first();

    if (!projectAccess) {
      logger.logSecurity('PROJECT_ACCESS_DENIED', {
        userId: req.user.id,
        projectId: projectId,
        endpoint: req.path,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'PROJECT_ACCESS_DENIED',
          message: 'You do not have access to this project'
        }
      });
    }

    next();
  } catch (error) {
    logger.logError(error, {
      middleware: 'requireProjectAccess',
      userId: req.user?.id,
      projectId: req.params.projectId
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'PROJECT_ACCESS_CHECK_ERROR',
        message: 'Error checking project access'
      }
    });
  }
};

// Optional authentication middleware (for public endpoints with optional auth)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    try {
      let decoded;
      if (config.auth0.domain && process.env.NODE_ENV === 'production') {
        decoded = await verifyAuth0Token(token);
      } else {
        decoded = await verifyInternalToken(token);
      }

      req.user = {
        id: decoded.sub || decoded.userId,
        email: decoded.email,
        role: decoded.role || decoded['https://ATHENEA.com/role'],
        permissions: decoded.permissions || decoded['https://ATHENEA.com/permissions'] || []
      };
    } catch (tokenError) {
      // Token is invalid, but that's okay for optional auth
      // Just continue without setting req.user
    }

    next();
  } catch (error) {
    logger.logError(error, {
      middleware: 'optionalAuth',
      url: req.url
    });
    next(); // Continue even if there's an error
  }
};

module.exports = {
  authMiddleware,
  requireRole,
  requirePermission,
  requireProjectAccess,
  optionalAuth
};