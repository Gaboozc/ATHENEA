const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../database');
const logger = require('../utils/logger');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array()
        }
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await db('users')
      .where('email', email)
      .where('is_active', true)
      .whereNull('deleted_at')
      .first();

    if (!user) {
      logger.logSecurity('LOGIN_ATTEMPT_INVALID_EMAIL', {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Check password (for development - in production use Auth0)
    if (process.env.NODE_ENV !== 'production') {
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        logger.logSecurity('LOGIN_ATTEMPT_INVALID_PASSWORD', {
          userId: user.id,
          email: user.email,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }
    }

    // Generate JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: [] // Add user permissions here
    };

    const token = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiration,
      issuer: config.jwt.issuer,
      algorithm: config.jwt.algorithm
    });

    // Update last login
    await db('users')
      .where('id', user.id)
      .update({
        last_login_at: new Date(),
        updated_at: new Date()
      });

    // Log successful login
    logger.logAuth('LOGIN_SUCCESS', user.id, {
      email: user.email,
      role: user.role,
      ip: req.ip
    });

    // Return success response (exclude password hash)
    const userResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      profile_image_url: user.profile_image_url
    };

    res.json({
      success: true,
      token,
      user: userResponse
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user (development only)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [technician, lead_technician, supervisor, project_manager]
 */
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase and number'),
  body('firstName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters'),
  body('role')
    .isIn(['technician', 'lead_technician', 'supervisor', 'project_manager'])
    .withMessage('Invalid role specified')
], async (req, res, next) => {
  try {
    // Only allow registration in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'REGISTRATION_DISABLED',
          message: 'User registration is handled by Auth0 in production'
        }
      });
    }

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array()
        }
      });
    }

    const { email, password, firstName, lastName, role, phone } = req.body;

    // Check if user already exists
    const existingUser = await db('users')
      .where('email', email)
      .first();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }

    // Hash password
    const saltRounds = config.security.bcryptSaltRounds;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userData = {
      email,
      password_hash: passwordHash,
      role,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      is_active: true,
      skills: JSON.stringify([])
    };

    const [newUser] = await db('users')
      .insert(userData)
      .returning(['id', 'email', 'role', 'first_name', 'last_name', 'created_at']);

    logger.logAuth('USER_REGISTERED', newUser.id, {
      email: newUser.email,
      role: newUser.role,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        first_name: newUser.first_name,
        last_name: newUser.last_name
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Refresh token is required'
        }
      });
    }

    const token = authHeader.substring(7);

    // Verify token (even if expired for refresh)
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret, { 
        ignoreExpiration: true,
        issuer: config.jwt.issuer 
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid refresh token'
        }
      });
    }

    // Check if user still exists and is active
    const user = await db('users')
      .where('id', decoded.userId)
      .where('is_active', true)
      .whereNull('deleted_at')
      .first();

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User no longer exists or is inactive'
        }
      });
    }

    // Generate new token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: []
    };

    const newToken = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiration,
      issuer: config.jwt.issuer,
      algorithm: config.jwt.algorithm
    });

    logger.logAuth('TOKEN_REFRESHED', user.id, {
      ip: req.ip
    });

    res.json({
      success: true,
      token: newToken
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout', async (req, res, next) => {
  try {
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just log the logout event
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, config.jwt.secret, {
          issuer: config.jwt.issuer
        });
        
        logger.logAuth('USER_LOGOUT', decoded.userId, {
          ip: req.ip
        });
      } catch (error) {
        // Token might be invalid, but that's okay for logout
      }
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;