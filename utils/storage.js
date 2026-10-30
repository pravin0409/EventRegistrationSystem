/**
 * In-Memory Storage Utility for Event Registration System
 * Practical No. 05 - Web Application Framework: ExpressJS
 */

const crypto = require('crypto');

// Initial catalogue of college events
const initialEvents = [
  {
    id: 'evt-1',
    name: 'College Hackathon',
    description: '24-hour inter-college coding marathon to build innovative software solutions.',
    date: '2026-11-15',
    venue: 'Auditorium & Computer Labs',
    capacity: 100,
    registrationCount: 0
  },
  {
    id: 'evt-2',
    name: 'Technical Symposium',
    description: 'Annual technical paper presentation, project exhibition, and tech quizzes.',
    date: '2026-11-22',
    venue: 'Seminar Hall A',
    capacity: 150,
    registrationCount: 0
  },
  {
    id: 'evt-3',
    name: 'AI & Machine Learning Workshop',
    description: 'Hands-on masterclass covering machine learning models, neural networks, and AI tools.',
    date: '2026-12-05',
    venue: 'Advanced Computing Lab',
    capacity: 60,
    registrationCount: 0
  },
  {
    id: 'evt-4',
    name: 'Web Development Bootcamp',
    description: 'Comprehensive workshop on full-stack web development with Node.js, Express, and modern JavaScript.',
    date: '2026-12-12',
    venue: 'Software Engineering Lab 3',
    capacity: 80,
    registrationCount: 0
  }
];

// In-memory data collections
let events = JSON.parse(JSON.stringify(initialEvents));
let registrations = [];

/**
 * Retrieve all available events
 * @returns {Array} List of events
 */
function getAllEvents() {
  return events.map((event) => ({ ...event }));
}

/**
 * Retrieve an event by its unique ID
 * @param {string} id - Event ID
 * @returns {Object|null} The matching event or null if not found
 */
function getEventById(id) {
  const event = events.find((e) => e.id === id);
  return event ? { ...event } : null;
}

/**
 * Check capacity and seat availability for an event
 * @param {string} eventId - Event ID
 * @returns {Object} Capacity metrics and availability status
 */
function checkEventCapacity(eventId) {
  const event = events.find((e) => e.id === eventId);
  if (!event) {
    return { exists: false, isFull: false, remainingSeats: 0, capacity: 0, registrationCount: 0 };
  }

  const remainingSeats = Math.max(0, event.capacity - event.registrationCount);
  return {
    exists: true,
    isFull: event.registrationCount >= event.capacity,
    remainingSeats,
    capacity: event.capacity,
    registrationCount: event.registrationCount
  };
}

/**
 * Retrieve all registrations
 * @returns {Array} List of registrations
 */
function getAllRegistrations() {
  return registrations.map((reg) => ({ ...reg }));
}

/**
 * Retrieve a registration by its unique ID
 * @param {string} id - Registration ID
 * @returns {Object|null} The matching registration or null if not found
 */
function getRegistrationById(id) {
  const registration = registrations.find((r) => r.id === id);
  return registration ? { ...registration } : null;
}

/**
 * Create a new event registration
 * Validates event existence and capacity, assigns a unique ID and timestamp,
 * and updates event registration count.
 * @param {Object} data - Participant and registration details
 * @returns {Object} Created registration record
 */
function createRegistration(data) {
  const { eventId, fullName, email, phone, college, ticketType = 'Standard', notes = '' } = data;

  const event = events.find((e) => e.id === eventId);
  if (!event) {
    throw new Error(`Event with ID "${eventId}" not found.`);
  }

  if (event.registrationCount >= event.capacity) {
    throw new Error(`Event "${event.name}" is already at full capacity (${event.capacity} seats).`);
  }

  const newRegistration = {
    id: `reg-${crypto.randomUUID()}`,
    eventId: event.id,
    eventName: event.name,
    fullName: fullName ? fullName.trim() : '',
    email: email ? email.trim().toLowerCase() : '',
    phone: phone ? phone.trim() : '',
    college: college ? college.trim() : '',
    ticketType,
    notes: notes ? notes.trim() : '',
    registeredAt: new Date().toISOString()
  };

  registrations.push(newRegistration);
  event.registrationCount += 1;

  return { ...newRegistration };
}

/**
 * Delete/cancel an existing registration by ID
 * Updates the corresponding event's registration count.
 * @param {string} id - Registration ID
 * @returns {Object|null} The deleted registration record or null if not found
 */
function deleteRegistration(id) {
  const index = registrations.findIndex((r) => r.id === id);
  if (index === -1) {
    return null;
  }

  const [removedRegistration] = registrations.splice(index, 1);

  // Decrement registration count on the associated event
  const event = events.find((e) => e.id === removedRegistration.eventId);
  if (event && event.registrationCount > 0) {
    event.registrationCount -= 1;
  }

  return removedRegistration;
}

/**
 * Reset in-memory storage to initial state (primarily for automated testing)
 */
function resetStorage() {
  events = JSON.parse(JSON.stringify(initialEvents));
  registrations = [];
}

module.exports = {
  getAllEvents,
  getEventById,
  checkEventCapacity,
  getAllRegistrations,
  getRegistrationById,
  createRegistration,
  deleteRegistration,
  resetStorage
};

