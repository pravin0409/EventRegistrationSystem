const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const validateRegistration = require('../middleware/validateRegistration');
const logger = require('../middleware/logger');
const errorHandler = require('../middleware/errorHandler');

// Mock response creator
function createMockResponse() {
  return {
    statusCode: 200,
    headersSent: false,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

describe('Middleware Tests', () => {
  describe('Registration Validation Middleware (validateRegistration)', () => {
    const validPayload = {
      fullName: 'Priya Sharma',
      email: '  PRIYA.sharma@example.edu  ',
      phone: '+91 98765-43210',
      college: 'Government Engineering College',
      eventId: 'evt-1',
      ticketType: 'Student',
      notes: 'Interested in algorithmic challenge'
    };

    it('should validate valid registration data, normalize values, and call next()', () => {
      const req = { body: { ...validPayload } };
      const res = createMockResponse();
      let nextCalled = false;

      validateRegistration(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
      assert.equal(res.statusCode, 200);
      assert.equal(req.body.fullName, 'Priya Sharma');
      assert.equal(req.body.email, 'priya.sharma@example.edu');
      assert.equal(req.body.phone, '9876543210');
      assert.equal(req.body.college, 'Government Engineering College');
      assert.equal(req.body.eventId, 'evt-1');
      assert.equal(req.body.ticketType, 'Student');
      assert.equal(req.body.notes, 'Interested in algorithmic challenge');
    });

    it('should reject non-object or null request body', () => {
      const req = { body: null };
      const res = createMockResponse();
      let nextCalled = false;

      validateRegistration(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.errors.includes('Request body must be a valid JSON object'));
    });

    it('should catch missing required fields', () => {
      const req = { body: {} };
      const res = createMockResponse();
      let nextCalled = false;

      validateRegistration(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.errors.includes('Full name is required'));
      assert.ok(res.body.errors.includes('Email is required'));
      assert.ok(res.body.errors.includes('Phone number is required'));
      assert.ok(res.body.errors.includes('College name is required'));
      assert.ok(res.body.errors.includes('Event selection is required'));
      assert.ok(res.body.errors.includes('Ticket type is required'));
    });

    it('should reject invalid full name (too short or with special characters/numbers)', () => {
      const req = {
        body: {
          ...validPayload,
          fullName: 'A123'
        }
      };
      const res = createMockResponse();
      let nextCalled = false;

      validateRegistration(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 400);
      assert.ok(
        res.body.errors.some((err) => err.includes('Full name can only contain letters'))
      );
    });

    it('should reject invalid email format', () => {
      const req = {
        body: {
          ...validPayload,
          email: 'invalid-email-format'
        }
      };
      const res = createMockResponse();
      let nextCalled = false;

      validateRegistration(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 400);
      assert.ok(res.body.errors.includes('A valid email address is required'));
    });

    it('should reject invalid Indian mobile numbers', () => {
      const invalidNumbers = [
        '5555555555', // Starts with 5
        '987654321', // 9 digits
        '987654321000', // 12 digits without prefix
        'abcdefghij' // Non-numeric
      ];

      for (const phone of invalidNumbers) {
        const req = { body: { ...validPayload, phone } };
        const res = createMockResponse();
        let nextCalled = false;

        validateRegistration(req, res, () => {
          nextCalled = true;
        });

        assert.equal(nextCalled, false);
        assert.equal(res.statusCode, 400);
        assert.ok(
          res.body.errors.some((e) => e.includes('valid 10-digit Indian mobile number')),
          `Expected error for phone: ${phone}`
        );
      }
    });

    it('should accept valid Indian mobile numbers with varied formatting', () => {
      const validNumbers = [
        { input: '9876543210', expected: '9876543210' },
        { input: '+91 8765432109', expected: '8765432109' },
        { input: '91-7654321098', expected: '7654321098' },
        { input: '(6123456789)', expected: '6123456789' }
      ];

      for (const item of validNumbers) {
        const req = { body: { ...validPayload, phone: item.input } };
        const res = createMockResponse();
        let nextCalled = false;

        validateRegistration(req, res, () => {
          nextCalled = true;
        });

        assert.equal(nextCalled, true);
        assert.equal(req.body.phone, item.expected);
      }
    });

    it('should reject college names outside 2-100 characters', () => {
      const req = {
        body: {
          ...validPayload,
          college: 'A'
        }
      };
      const res = createMockResponse();
      let nextCalled = false;

      validateRegistration(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 400);
      assert.ok(res.body.errors.includes('College name must be between 2 and 100 characters'));
    });

    it('should reject non-existent event ID', () => {
      const req = {
        body: {
          ...validPayload,
          eventId: 'evt-does-not-exist'
        }
      };
      const res = createMockResponse();
      let nextCalled = false;

      validateRegistration(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 400);
      assert.ok(res.body.errors.includes('Selected event is invalid or does not exist'));
    });

    it('should reject invalid ticket type', () => {
      const req = {
        body: {
          ...validPayload,
          ticketType: 'VIP'
        }
      };
      const res = createMockResponse();
      let nextCalled = false;

      validateRegistration(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 400);
      assert.ok(res.body.errors.includes('Ticket type must be either Standard or Student'));
    });

    it('should reject notes exceeding 300 characters', () => {
      const req = {
        body: {
          ...validPayload,
          notes: 'A'.repeat(301)
        }
      };
      const res = createMockResponse();
      let nextCalled = false;

      validateRegistration(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 400);
      assert.ok(res.body.errors.includes('Notes must not exceed 300 characters'));
    });

    it('should collect multiple validation errors together', () => {
      const req = {
        body: {
          fullName: '1',
          email: 'invalid',
          phone: '123',
          college: 'C',
          eventId: 'invalid-id',
          ticketType: 'Free'
        }
      };
      const res = createMockResponse();
      let nextCalled = false;

      validateRegistration(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.errors.length >= 5);
    });
  });

  describe('Request Logger Middleware (logger)', () => {
    it('should log request details and call next() without interruption', () => {
      const req = { method: 'GET', originalUrl: '/api/events' };
      const res = createMockResponse();
      let nextCalled = false;

      logger(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
    });
  });

  describe('Centralized Error Handler (errorHandler)', () => {
    const originalEnv = process.env.NODE_ENV;

    it('should return 500 status and safe error message by default in non-production', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Database connection failed');
      const req = {};
      const res = createMockResponse();
      let nextCalled = false;

      errorHandler(error, req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 500);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, 'Database connection failed');
      process.env.NODE_ENV = originalEnv;
    });

    it('should hide internal message for HTTP 500 in production mode', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Sensitive SQL/database failure details');
      const req = {};
      const res = createMockResponse();

      errorHandler(error, req, res, () => {});

      assert.equal(res.statusCode, 500);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, 'Internal Server Error');
      process.env.NODE_ENV = originalEnv;
    });

    it('should hide internal message for HTTP 503 in production mode', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Service Unavailable: Upstream cluster failure');
      error.statusCode = 503;
      const req = {};
      const res = createMockResponse();

      errorHandler(error, req, res, () => {});

      assert.equal(res.statusCode, 503);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, 'Internal Server Error');
      process.env.NODE_ENV = originalEnv;
    });

    it('should retain custom client error messages (400-499) even in production mode', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Event registration not found');
      error.statusCode = 404;
      const req = {};
      const res = createMockResponse();

      errorHandler(error, req, res, () => {});

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, 'Event registration not found');
      process.env.NODE_ENV = originalEnv;
    });

    it('should respect custom status code if attached to error', () => {
      const error = new Error('Resource not found');
      error.statusCode = 404;
      const req = {};
      const res = createMockResponse();

      errorHandler(error, req, res, () => {});

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.message, 'Resource not found');
    });

    it('should delegate to next(err) if headers are already sent', () => {
      const error = new Error('Late failure');
      const req = {};
      const res = createMockResponse();
      res.headersSent = true;
      let passedError = null;

      errorHandler(error, req, res, (err) => {
        passedError = err;
      });

      assert.equal(passedError, error);
    });
  });
});

