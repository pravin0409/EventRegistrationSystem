const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const storage = require('../utils/storage');

describe('In-Memory Storage Utility Tests', () => {
  beforeEach(() => {
    storage.resetStorage();
  });

  describe('Event Catalogue Operations', () => {
    it('should initialize with four predefined college events', () => {
      const events = storage.getAllEvents();
      assert.equal(events.length, 4);

      const eventNames = events.map((e) => e.name);
      assert.ok(eventNames.includes('College Hackathon'));
      assert.ok(eventNames.includes('Technical Symposium'));
      assert.ok(eventNames.includes('AI & Machine Learning Workshop'));
      assert.ok(eventNames.includes('Web Development Bootcamp'));
    });

    it('should retrieve a specific event by ID', () => {
      const event = storage.getEventById('evt-1');
      assert.ok(event);
      assert.equal(event.id, 'evt-1');
      assert.equal(event.name, 'College Hackathon');
      assert.equal(event.capacity, 100);
      assert.equal(event.registrationCount, 0);
    });

    it('should return null for an invalid event ID', () => {
      const event = storage.getEventById('evt-999');
      assert.equal(event, null);
    });

    it('should check event capacity status correctly', () => {
      const capacityInfo = storage.checkEventCapacity('evt-1');
      assert.equal(capacityInfo.exists, true);
      assert.equal(capacityInfo.isFull, false);
      assert.equal(capacityInfo.remainingSeats, 100);
      assert.equal(capacityInfo.capacity, 100);
      assert.equal(capacityInfo.registrationCount, 0);
    });
  });

  describe('Registration Operations', () => {
    const validData = {
      eventId: 'evt-1',
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@example.edu',
      phone: '9876543210',
      college: 'College of Engineering',
      ticketType: 'Student',
      notes: 'Team Lead'
    };

    it('should create a registration and increment event registration count', () => {
      const reg = storage.createRegistration(validData);

      assert.ok(reg.id.startsWith('reg-'));
      assert.equal(reg.eventId, 'evt-1');
      assert.equal(reg.eventName, 'College Hackathon');
      assert.equal(reg.fullName, 'Aarav Sharma');
      assert.equal(reg.email, 'aarav.sharma@example.edu');
      assert.ok(reg.registeredAt);

      const updatedEvent = storage.getEventById('evt-1');
      assert.equal(updatedEvent.registrationCount, 1);

      const capacityInfo = storage.checkEventCapacity('evt-1');
      assert.equal(capacityInfo.remainingSeats, 99);
      assert.equal(capacityInfo.registrationCount, 1);
    });

    it('should retrieve all registrations and get a registration by ID', () => {
      const created = storage.createRegistration(validData);

      const all = storage.getAllRegistrations();
      assert.equal(all.length, 1);
      assert.equal(all[0].id, created.id);

      const fetched = storage.getRegistrationById(created.id);
      assert.ok(fetched);
      assert.equal(fetched.fullName, 'Aarav Sharma');
    });

    it('should delete a registration and decrement event registration count', () => {
      const created = storage.createRegistration(validData);
      assert.equal(storage.getEventById('evt-1').registrationCount, 1);

      const deleted = storage.deleteRegistration(created.id);
      assert.ok(deleted);
      assert.equal(deleted.id, created.id);

      assert.equal(storage.getAllRegistrations().length, 0);
      assert.equal(storage.getEventById('evt-1').registrationCount, 0);
    });

    it('should return null when deleting non-existent registration', () => {
      const result = storage.deleteRegistration('reg-non-existent');
      assert.equal(result, null);
    });

    it('should throw an error when registering for a non-existent event', () => {
      assert.throws(
        () => {
          storage.createRegistration({
            ...validData,
            eventId: 'evt-invalid'
          });
        },
        {
          message: 'Event with ID "evt-invalid" not found.'
        }
      );
    });

    it('should throw an error when registering for an event at full capacity', () => {
      // Artificially fill capacity for evt-3 (capacity = 60)
      const event = storage.getEventById('evt-3');
      for (let i = 0; i < event.capacity; i++) {
        storage.createRegistration({
          eventId: 'evt-3',
          fullName: `Participant ${i}`,
          email: `participant${i}@test.com`,
          phone: '9000000000',
          college: 'Eng College'
        });
      }

      const fullEvent = storage.getEventById('evt-3');
      assert.equal(fullEvent.registrationCount, fullEvent.capacity);

      const capacityInfo = storage.checkEventCapacity('evt-3');
      assert.equal(capacityInfo.isFull, true);
      assert.equal(capacityInfo.remainingSeats, 0);

      assert.throws(
        () => {
          storage.createRegistration({
            eventId: 'evt-3',
            fullName: 'Overflow Participant',
            email: 'overflow@test.com',
            phone: '9000000000',
            college: 'Eng College'
          });
        },
        /already at full capacity/
      );
    });
  });
});

