import logger from '../utils/logger.js';
import ApiError from '../utils/ApiError.js';

// 404 handler
export const notFound = (req, res, _next) =>
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });

// Global error handler
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  // Mongoose validation
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    details = Object.fromEntries(
      Object.entries(err.errors || {}).map(([k, v]) => [k, v.message])
    );
  }

  // Mongoose cast (bad ObjectId, etc.)
  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongo duplicate key
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field || 'Field'} already exists`;
    details = err.keyValue;
  }

  if (status >= 500) {
    logger.error('Unhandled server error', { path: req.originalUrl, error: err.stack });
  } else {
    logger.warn('Request error', { path: req.originalUrl, status, message });
  }

  res.status(status).json({
    success: false,
    message,
    ...(details !== undefined ? { details } : {}),
    ...(process.env.NODE_ENV !== 'production' && err.stack ? { stack: err.stack } : {}),
  });
};

export { ApiError };
