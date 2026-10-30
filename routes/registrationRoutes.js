/**
 * Registration Routes
 * Practical No. 05 - Web Application Framework: ExpressJS
 */

const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const validateRegistration = require('../middleware/validateRegistration');

// POST /api/registrations - Register for an event with validation middleware
router.post('/', validateRegistration, registrationController.createRegistration);

// GET /api/registrations - Retrieve all registrations
router.get('/', registrationController.getAllRegistrations);

// GET /api/registrations/:id - Retrieve registration by ID
router.get('/:id', registrationController.getRegistrationById);

// DELETE /api/registrations/:id - Cancel registration and restore event capacity
router.delete('/:id', registrationController.deleteRegistration);

module.exports = router;

