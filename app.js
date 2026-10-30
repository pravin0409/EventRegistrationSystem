/**
 * Express Application Configuration
 * Practical No. 05 - Web Application Framework: ExpressJS
 */

const express = require('express');
const path = require('path');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');

const app = express();

// Built-in body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(logger);

// Serve static frontend assets from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    appName: 'Event Registration System',
    status: 'OK',
    serverStatus: 'running',
    timestamp: new Date().toISOString()
  });
});

// Mount modular API routes
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);

// 404 Handler for unmatched routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`
  });
});

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;

