const logger = require('../utils/logger');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> user info
  }

  initialize(io) {
    this.io = io;
    
    io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      // Handle authentication
      socket.on('authenticate', (data) => {
        const { userId, projectId } = data;
        
        if (userId) {
          this.connectedUsers.set(userId, socket.id);
          this.userSockets.set(socket.id, { userId, projectId });
          
          // Join project room if specified
          if (projectId) {
            socket.join(`project:${projectId}`);
          }
          
          logger.info(`User authenticated: ${userId} in project: ${projectId}`);
        }
      });

      // Handle project subscription
      socket.on('join_project', (projectId) => {
        socket.join(`project:${projectId}`);
        logger.info(`Socket ${socket.id} joined project: ${projectId}`);
      });

      socket.on('leave_project', (projectId) => {
        socket.leave(`project:${projectId}`);
        logger.info(`Socket ${socket.id} left project: ${projectId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const userInfo = this.userSockets.get(socket.id);
        if (userInfo) {
          this.connectedUsers.delete(userInfo.userId);
          this.userSockets.delete(socket.id);
          logger.info(`User disconnected: ${userInfo.userId}`);
        }
      });
    });

    logger.info('Socket.IO service initialized');
  }

  // Emit to specific user
  emitToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId && this.io) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  // Emit to project room
  emitToProject(projectId, event, data) {
    if (this.io) {
      this.io.to(`project:${projectId}`).emit(event, data);
      return true;
    }
    return false;
  }

  // Emit to all connected users
  emitToAll(event, data) {
    if (this.io) {
      this.io.emit(event, data);
      return true;
    }
    return false;
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Check if user is connected
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }
}

module.exports = new SocketService();