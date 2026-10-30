/**
 * Event Routes
 * Practical No. 05 - Web Application Framework: ExpressJS
 */

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// GET /api/events - Retrieve all events
router.get('/', eventController.getAllEvents);

// GET /api/events/:id - Retrieve event by ID
router.get('/:id', eventController.getEventById);

module.exports = router;

