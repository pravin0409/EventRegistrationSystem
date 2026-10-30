/**
 * Registration Validation Middleware
 * Practical No. 05 - Web Application Framework: ExpressJS
 */

const storage = require('../utils/storage');

/**
 * Normalizes and validates Indian phone numbers.
 * Accepts optional +91 or 91 prefix, spaces, hyphens, and returns 10-digit string if valid.
 * @param {string|number} phone
 * @returns {string|null} 10-digit phone string or null if invalid
 */
function normalizeIndianPhone(phone) {
  if (typeof phone === 'number') {
    phone = phone.toString();
  }
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Remove common separators (spaces, hyphens, parentheses)
  let cleaned = phone.trim().replace(/[\s\-()]/g, '');

  // Strip international prefix +91 or 91
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  }

  // Validate exactly 10 digits starting with 6, 7, 8, or 9
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return cleaned;
  }

  return null;
}

/**
 * Validates registration request body
 */
function validateRegistration(req, res, next) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: ['Request body must be a valid JSON object']
    });
  }

  const { fullName, email, phone, college, eventId, ticketType, notes } = req.body;
  const errors = [];
  const normalized = {};

  // 1. fullName: required, 2–60 chars, letters, spaces, hyphens, apostrophes
  if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
    errors.push('Full name is required');
  } else {
    const trimmedName = fullName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 60) {
      errors.push('Full name must be between 2 and 60 characters');
    } else if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
      errors.push('Full name can only contain letters, spaces, hyphens, and apostrophes');
    } else {
      normalized.fullName = trimmedName;
    }
  }

  // 2. email: required, valid email format, normalized to lowercase and trimmed
  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email is required');
  } else {
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 254) {
      errors.push('A valid email address is required');
    } else {
      normalized.email = trimmedEmail;
    }
  }

  // 3. phone: required, valid Indian 10-digit mobile number starting with 6, 7, 8 or 9
  if (phone === undefined || phone === null || (typeof phone === 'string' && !phone.trim())) {
    errors.push('Phone number is required');
  } else {
    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone) {
      errors.push('A valid 10-digit Indian mobile number is required (starting with 6, 7, 8, or 9)');
    } else {
      normalized.phone = normalizedPhone;
    }
  }

  // 4. college: required, 2–100 characters
  if (!college || typeof college !== 'string' || !college.trim()) {
    errors.push('College name is required');
  } else {
    const trimmedCollege = college.trim();
    if (trimmedCollege.length < 2 || trimmedCollege.length > 100) {
      errors.push('College name must be between 2 and 100 characters');
    } else {
      normalized.college = trimmedCollege;
    }
  }

  // 5. eventId: required, must match existing event in storage
  if (!eventId || typeof eventId !== 'string' || !eventId.trim()) {
    errors.push('Event selection is required');
  } else {
    const trimmedEventId = eventId.trim();
    const event = storage.getEventById(trimmedEventId);
    if (!event) {
      errors.push('Selected event is invalid or does not exist');
    } else {
      normalized.eventId = trimmedEventId;
    }
  }

  // 6. ticketType: required, must be Standard or Student
  const validTicketTypes = ['Standard', 'Student'];
  if (!ticketType || typeof ticketType !== 'string' || !ticketType.trim()) {
    errors.push('Ticket type is required');
  } else {
    const trimmedTicketType = ticketType.trim();
    if (!validTicketTypes.includes(trimmedTicketType)) {
      errors.push('Ticket type must be either Standard or Student');
    } else {
      normalized.ticketType = trimmedTicketType;
    }
  }

  // 7. notes: optional, maximum 300 characters
  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      errors.push('Notes must be text');
    } else if (notes.trim().length > 300) {
      errors.push('Notes must not exceed 300 characters');
    } else {
      normalized.notes = notes.trim();
    }
  } else {
    normalized.notes = '';
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Store normalized values in req.body
  req.body = {
    ...req.body,
    ...normalized
  };

  next();
}

module.exports = validateRegistration;

