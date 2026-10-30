/**
 * Centralized Error Handling Middleware
 * Practical No. 05 - Web Application Framework: ExpressJS
 */

function errorHandler(err, req, res, next) {
  // If response headers have already been sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Log error on server
  console.error('[Error Handler]', err);

  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const isServerError = statusCode >= 500 && statusCode <= 599;

  res.status(statusCode).json({
    success: false,
    message: isProduction && isServerError
      ? 'Internal Server Error'
      : err.message || 'An unexpected error occurred'
  });
}

module.exports = errorHandler;

