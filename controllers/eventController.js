/**
 * Event Controller
 * Practical No. 05 - Web Application Framework: ExpressJS
 */

const storage = require('../utils/storage');

/**
 * Get all events with capacity details
 */
function getAllEvents(req, res, next) {
  try {
    const events = storage.getAllEvents().map((event) => {
      const capacityInfo = storage.checkEventCapacity(event.id);
      return {
        ...event,
        remainingSeats: capacityInfo.remainingSeats,
        isFull: capacityInfo.isFull
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Events retrieved successfully',
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single event by ID
 */
function getEventById(req, res, next) {
  try {
    const { id } = req.params;
    const event = storage.getEventById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: `Event with ID "${id}" not found`
      });
    }

    const capacityInfo = storage.checkEventCapacity(event.id);
    const enrichedEvent = {
      ...event,
      remainingSeats: capacityInfo.remainingSeats,
      isFull: capacityInfo.isFull
    };

    return res.status(200).json({
      success: true,
      data: enrichedEvent
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllEvents,
  getEventById
};

