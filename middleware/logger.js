/**
 * Request Logging Middleware
 * Practical No. 05 - Web Application Framework: ExpressJS
 */

function logger(req, res, next) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;

  console.log(`[${timestamp}] ${method} ${url}`);
  next();
}

module.exports = logger;

