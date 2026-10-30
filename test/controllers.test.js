const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const storage = require('../utils/storage');
const eventController = require('../controllers/eventController');
const registrationController = require('../controllers/registrationController');

function createMockResponse() {
  return {
    statusCode: 200,
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

describe('Controller Tests', () => {
  beforeEach(() => {
    storage.resetStorage();
  });

  describe('Event Controller (eventController)', () => {
    it('should retrieve all events with capacity metrics', () => {
      const req = {};
      const res = createMockResponse();

      eventController.getAllEvents(req, res, () => {});

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.count, 4);
      assert.equal(Array.isArray(res.body.data), true);

      const firstEvent = res.body.data[0];
      assert.ok('remainingSeats' in firstEvent);
      assert.ok('isFull' in firstEvent);
      assert.equal(firstEvent.remainingSeats, firstEvent.capacity);
    });

    it('should retrieve a single valid event by ID', () => {
      const req = { params: { id: 'evt-1' } };
      const res = createMockResponse();

      eventController.getEventById(req, res, () => {});

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.id, 'evt-1');
      assert.equal(res.body.data.name, 'College Hackathon');
      assert.equal(res.body.data.remainingSeats, 100);
    });

    it('should return 404 when requesting a nonexistent event', () => {
      const req = { params: { id: 'evt-unknown-999' } };
      const res = createMockResponse();

      eventController.getEventById(req, res, () => {});

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.includes('not found'));
    });
  });

  describe('Registration Controller (registrationController)', () => {
    const validRegistrationData = {
      eventId: 'evt-2',
      fullName: 'Rohit Kulkarni',
      email: 'rohit.k@example.edu',
      phone: '9823456789',
      college: 'Pune Institute of Technology',
      ticketType: 'Student',
      notes: 'Paper Presentation track'
    };

    it('should create a valid registration with HTTP 201', () => {
      const req = { body: { ...validRegistrationData } };
      const res = createMockResponse();

      registrationController.createRegistration(req, res, () => {});

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.message, 'Registration created successfully');
      assert.ok(res.body.data.id.startsWith('reg-'));
      assert.equal(res.body.data.fullName, 'Rohit Kulkarni');
      assert.equal(res.body.data.eventName, 'Technical Symposium');

      // Verify event count in storage was incremented
      const event = storage.getEventById('evt-2');
      assert.equal(event.registrationCount, 1);
    });

    it('should return 409 Conflict when attempting to register for a full event', () => {
      const event = storage.getEventById('evt-3');
      for (let i = 0; i < event.capacity; i++) {
        storage.createRegistration({
          eventId: 'evt-3',
          fullName: `Participant ${i}`,
          email: `p${i}@example.com`,
          phone: '9123456780',
          college: 'Test College'
        });
      }

      const req = {
        body: {
          eventId: 'evt-3',
          fullName: 'Late Registrant',
          email: 'late@example.com',
          phone: '9123456789',
          college: 'Test College',
          ticketType: 'Standard'
        }
      };
      const res = createMockResponse();

      registrationController.createRegistration(req, res, () => {});

      assert.equal(res.statusCode, 409);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.includes('full capacity'));
    });

    it('should retrieve all registrations', () => {
      storage.createRegistration(validRegistrationData);

      const req = {};
      const res = createMockResponse();

      registrationController.getAllRegistrations(req, res, () => {});

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.count, 1);
      assert.equal(res.body.data.length, 1);
      assert.equal(res.body.data[0].fullName, 'Rohit Kulkarni');
    });

    it('should retrieve a registration by ID', () => {
      const created = storage.createRegistration(validRegistrationData);

      const req = { params: { id: created.id } };
      const res = createMockResponse();

      registrationController.getRegistrationById(req, res, () => {});

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.id, created.id);
      assert.equal(res.body.data.fullName, 'Rohit Kulkarni');
    });

    it('should return 404 when requesting a nonexistent registration', () => {
      const req = { params: { id: 'reg-does-not-exist' } };
      const res = createMockResponse();

      registrationController.getRegistrationById(req, res, () => {});

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.includes('not found'));
    });

    it('should cancel a registration with HTTP 200 and return deleted record', () => {
      const created = storage.createRegistration(validRegistrationData);

      const req = { params: { id: created.id } };
      const res = createMockResponse();

      registrationController.deleteRegistration(req, res, () => {});

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.message, 'Registration cancelled successfully');
      assert.equal(res.body.data.id, created.id);
    });

    it('should return 404 when cancelling a nonexistent registration', () => {
      const req = { params: { id: 'reg-nonexistent-id' } };
      const res = createMockResponse();

      registrationController.deleteRegistration(req, res, () => {});

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.includes('not found'));
    });

    it('should restore event registration count and capacity after cancellation', () => {
      const created = storage.createRegistration(validRegistrationData);
      assert.equal(storage.getEventById('evt-2').registrationCount, 1);

      const req = { params: { id: created.id } };
      const res = createMockResponse();

      registrationController.deleteRegistration(req, res, () => {});

      assert.equal(res.statusCode, 200);
      const eventAfter = storage.getEventById('evt-2');
      assert.equal(eventAfter.registrationCount, 0);

      const capacityInfo = storage.checkEventCapacity('evt-2');
      assert.equal(capacityInfo.remainingSeats, 150);
      assert.equal(capacityInfo.isFull, false);
    });
  });
});

