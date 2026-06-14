const logger = require("../utils/logger");

/**
 * Global error handling middleware.
 * Must be registered LAST in server.js (after all routes).
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  // Log full error details (stack included for 500s)
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} → ${message}`, { stack: err.stack });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} → ${statusCode}: ${message}`);
  }

  // Send clean JSON response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
