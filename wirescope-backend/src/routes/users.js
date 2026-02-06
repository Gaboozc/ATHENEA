const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { requireRole, requirePermission } = require('../middleware/auth');
const db = require('../database');
const logger = require('../utils/logger');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [technician, lead_technician, supervisor, project_manager]
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         phone:
 *           type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         is_active:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (supervisor+ only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 */
router.get('/', 
  requireRole('supervisor'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('role').optional().isIn(['technician', 'lead_technician', 'supervisor', 'project_manager']),
    query('search').optional().trim().isLength({ min: 2 }).withMessage('Search term must be at least 2 characters')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: errors.array()
          }
        });
      }

      const { page = 1, limit = 20, role, search } = req.query;

      let query = db('users')
        .select([
          'id', 'email', 'role', 'first_name', 'last_name', 
          'phone', 'skills', 'is_active', 'last_login_at', 'created_at'
        ])
        .whereNull('deleted_at');

      // Apply filters
      if (role) {
        query = query.where('role', role);
      }

      if (search) {
        query = query.where(function() {
          this.where('first_name', 'ilike', `%${search}%`)
              .orWhere('last_name', 'ilike', `%${search}%`)
              .orWhere('email', 'ilike', `%${search}%`);
        });
      }

      // Order by created_at desc
      query = query.orderBy('created_at', 'desc');

      // Get paginated results
      const result = await db.paginate(query, page, limit);

      // Parse skills JSON for each user
      result.data.forEach(user => {
        if (user.skills) {
          try {
            user.skills = JSON.parse(user.skills);
          } catch (e) {
            user.skills = [];
          }
        } else {
          user.skills = [];
        }
      });

      res.json({
        success: true,
        users: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/:id', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Users can view their own profile, supervisors+ can view any profile
    if (req.user.id !== userId && !['supervisor', 'project_manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You can only view your own profile'
        }
      });
    }

    const user = await db('users')
      .select([
        'id', 'email', 'role', 'first_name', 'last_name',
        'phone', 'skills', 'profile_image_url', 'is_active',
        'last_login_at', 'created_at'
      ])
      .where('id', userId)
      .whereNull('deleted_at')
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Parse skills JSON
    if (user.skills) {
      try {
        user.skills = JSON.parse(user.skills);
      } catch (e) {
        user.skills = [];
      }
    } else {
      user.skills = [];
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create new user (project manager only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.post('/',
  requireRole('project_manager'),
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('role').isIn(['technician', 'lead_technician', 'supervisor', 'project_manager']),
    body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('phone').optional().isMobilePhone(),
    body('skills').optional().isArray().withMessage('Skills must be an array')
  ],
  async (req, res, next) => {
    try {
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

      const { email, role, firstName, lastName, phone, skills = [] } = req.body;

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

      // Create user (without password - Auth0 handles authentication)
      const userData = {
        email,
        role,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        skills: JSON.stringify(skills),
        is_active: true
      };

      const newUser = await db.create('users', userData);

      logger.logDatabase('CREATE', 'users', newUser.id, {
        email: newUser.email,
        role: newUser.role,
        createdBy: req.user.id
      });

      // Return user without sensitive data
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          phone: newUser.phone,
          skills: JSON.parse(newUser.skills || '[]'),
          is_active: newUser.is_active,
          created_at: newUser.created_at
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id',
  [
    body('firstName').optional().trim().isLength({ min: 2 }),
    body('lastName').optional().trim().isLength({ min: 2 }),
    body('phone').optional().isMobilePhone(),
    body('skills').optional().isArray(),
    body('role').optional().isIn(['technician', 'lead_technician', 'supervisor', 'project_manager'])
  ],
  async (req, res, next) => {
    try {
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

      const userId = parseInt(req.params.id);
      const { firstName, lastName, phone, skills, role } = req.body;

      // Check permissions
      const canEditRole = ['project_manager'].includes(req.user.role);
      const canEditUser = req.user.id === userId || ['supervisor', 'project_manager'].includes(req.user.role);

      if (!canEditUser) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'You can only edit your own profile'
          }
        });
      }

      // If trying to change role, check permission
      if (role && !canEditRole) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'You do not have permission to change user roles'
          }
        });
      }

      // Prepare update data
      const updateData = {};
      if (firstName) updateData.first_name = firstName;
      if (lastName) updateData.last_name = lastName;
      if (phone !== undefined) updateData.phone = phone;
      if (skills) updateData.skills = JSON.stringify(skills);
      if (role && canEditRole) updateData.role = role;

      // Update user
      const updatedUser = await db.update('users', userId, updateData);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      logger.logDatabase('UPDATE', 'users', userId, {
        updatedBy: req.user.id,
        fields: Object.keys(updateData)
      });

      res.json({
        success: true,
        message: 'User updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          phone: updatedUser.phone,
          skills: JSON.parse(updatedUser.skills || '[]'),
          updated_at: updatedUser.updated_at
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user (project manager only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id',
  requireRole('project_manager'),
  async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);

      // Cannot delete yourself
      if (req.user.id === userId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_DELETE_SELF',
            message: 'You cannot delete your own account'
          }
        });
      }

      // Soft delete user
      const deletedCount = await db.softDelete('users', userId, req.user.id);

      if (deletedCount === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      logger.logDatabase('DELETE', 'users', userId, {
        deletedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;