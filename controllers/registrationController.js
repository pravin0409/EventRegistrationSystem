/**
 * Registration Controller
 * Practical No. 05 - Web Application Framework: ExpressJS
 */

const storage = require('../utils/storage');

/**
 * Create a new event registration
 */
function createRegistration(req, res, next) {
  try {
    const registration = storage.createRegistration(req.body);

    return res.status(201).json({
      success: true,
      message: 'Registration created successfully',
      data: registration
    });
  } catch (error) {
    if (error.message && error.message.includes('full capacity')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

/**
 * Retrieve all registrations
 */
function getAllRegistrations(req, res, next) {
  try {
    const registrations = storage.getAllRegistrations();

    return res.status(200).json({
      success: true,
      message: 'Registrations retrieved successfully',
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve a single registration by ID
 */
function getRegistrationById(req, res, next) {
  try {
    const { id } = req.params;
    const registration = storage.getRegistrationById(id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: `Registration with ID "${id}" not found`
      });
    }

    return res.status(200).json({
      success: true,
      data: registration
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel/delete a registration by ID and restore event capacity
 */
function deleteRegistration(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = storage.deleteRegistration(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Registration with ID "${id}" not found`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully',
      data: deleted
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createRegistration,
  getAllRegistrations,
  getRegistrationById,
  deleteRegistration
};

