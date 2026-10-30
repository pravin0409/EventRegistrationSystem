/**
 * Server Entry Point
 * Practical No. 05 - Web Application Framework: ExpressJS
 */

const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`[Event Registration System] Server running on http://localhost:${PORT}`);
});

module.exports = server;

