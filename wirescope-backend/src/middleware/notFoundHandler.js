const notFoundHandler = (req, res, next) => {
  const message = `Route ${req.originalUrl} not found`;
  
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: message,
    },
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown',
  });
};

module.exports = notFoundHandler;