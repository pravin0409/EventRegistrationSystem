const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { EventEmitter } = require('node:events');
const app = require('../app');
const storage = require('../utils/storage');

/**
 * Dependency-free in-memory HTTP request dispatcher for Express apps
 */
function makeRequest(expressApp, { method = 'GET', url = '/', body = null, headers = {} }) {
  return new Promise((resolve, reject) => {
    let req;
    const bodyStr = body ? JSON.stringify(body) : '';

    if (body) {
      req = Readable.from([Buffer.from(bodyStr)]);
      req.headers = {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(bodyStr),
        ...headers
      };
    } else {
      req = Readable.from([]);
      req.headers = { ...headers };
    }

    req.method = method;
    req.url = url;

    let statusCode = 200;
    const resHeaders = {};
    let responseBody = '';

    const res = new EventEmitter();
    res.setHeader = (key, value) => {
      resHeaders[key.toLowerCase()] = value;
    };
    res.getHeader = (key) => resHeaders[key.toLowerCase()];
    res.writeHead = (code, hdrs) => {
      statusCode = code;
      if (hdrs) Object.assign(resHeaders, hdrs);
    };
    res.status = (code) => {
      statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.setHeader('content-type', 'application/json');
      responseBody = JSON.stringify(data);
      res.emit('finish');
    };
    res.send = (data) => {
      responseBody = typeof data === 'object' ? JSON.stringify(data) : String(data);
      res.emit('finish');
    };
    res.end = (chunk) => {
      if (chunk) responseBody += chunk;
      res.emit('finish');
    };

    res.on('finish', () => {
      resolve({
        status: statusCode,
        headers: resHeaders,
        json: () => JSON.parse(responseBody),
        text: () => responseBody
      });
    });

    expressApp.handle(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        res.status(404).json({ success: false, message: 'Route not found' });
      }
    });
  });
}

describe('Server Application Integration Tests', () => {
  beforeEach(() => {
    storage.resetStorage();
  });

  it('GET /health - should return server health and application details', async () => {
    const res = await makeRequest(app, { method: 'GET', url: '/health' });
    assert.equal(res.status, 200);

    const data = res.json();
    assert.equal(data.success, true);
    assert.equal(data.appName, 'Event Registration System');
    assert.equal(data.status, 'OK');
    assert.equal(data.serverStatus, 'running');
    assert.ok(data.timestamp);
  });

  it('GET /api/events - should return list of available events', async () => {
    const res = await makeRequest(app, { method: 'GET', url: '/api/events' });
    assert.equal(res.status, 200);

    const data = res.json();
    assert.equal(data.success, true);
    assert.equal(data.count, 4);
    assert.equal(data.data.length, 4);
    assert.equal(data.data[0].id, 'evt-1');
    assert.ok(data.data[0].remainingSeats > 0);
  });

  it('GET /api/events/evt-1 - should return specific event details', async () => {
    const res = await makeRequest(app, { method: 'GET', url: '/api/events/evt-1' });
    assert.equal(res.status, 200);

    const data = res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.id, 'evt-1');
    assert.equal(data.data.name, 'College Hackathon');
    assert.equal(data.data.capacity, 100);
  });

  it('GET /api/events/invalid-id - should return 404 for unknown event ID', async () => {
    const res = await makeRequest(app, { method: 'GET', url: '/api/events/invalid-id' });
    assert.equal(res.status, 404);

    const data = res.json();
    assert.equal(data.success, false);
    assert.ok(data.message.includes('not found'));
  });

  it('GET /api/unknown-endpoint - should return 404 JSON for unmatched route', async () => {
    const res = await makeRequest(app, { method: 'GET', url: '/api/unknown-endpoint' });
    assert.equal(res.status, 404);

    const data = res.json();
    assert.equal(data.success, false);
    assert.ok(data.message.includes('Route not found'));
  });

  it('POST /api/registrations - should return 400 for invalid registration payload', async () => {
    const invalidPayload = {
      fullName: 'X', // too short
      email: 'not-an-email',
      phone: '12345',
      college: '',
      eventId: 'evt-does-not-exist',
      ticketType: 'VIP'
    };

    const res = await makeRequest(app, {
      method: 'POST',
      url: '/api/registrations',
      body: invalidPayload
    });

    assert.equal(res.status, 400);
    const data = res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, 'Validation failed');
    assert.ok(Array.isArray(data.errors));
    assert.ok(data.errors.length >= 5);
  });

  it('POST /api/registrations - should register participant successfully with 201', async () => {
    const validPayload = {
      fullName: 'Neha Patel',
      email: 'neha.patel@example.com',
      phone: '+91 9988776655',
      college: 'Institute of Engineering',
      eventId: 'evt-1',
      ticketType: 'Student',
      notes: 'Interested in web track'
    };

    const res = await makeRequest(app, {
      method: 'POST',
      url: '/api/registrations',
      body: validPayload
    });

    assert.equal(res.status, 201);
    const data = res.json();
    assert.equal(data.success, true);
    assert.equal(data.message, 'Registration created successfully');
    assert.ok(data.data.id.startsWith('reg-'));
    assert.equal(data.data.fullName, 'Neha Patel');
    assert.equal(data.data.phone, '9988776655'); // normalized phone
  });

  it('GET /api/registrations - should return registrations after creating one', async () => {
    const payload = {
      fullName: 'Vikram Joshi',
      email: 'vikram.j@example.com',
      phone: '9876543210',
      college: 'City Engineering College',
      eventId: 'evt-2',
      ticketType: 'Standard'
    };

    const createRes = await makeRequest(app, {
      method: 'POST',
      url: '/api/registrations',
      body: payload
    });
    assert.equal(createRes.status, 201);

    const getRes = await makeRequest(app, {
      method: 'GET',
      url: '/api/registrations'
    });
    assert.equal(getRes.status, 200);

    const getData = getRes.json();
    assert.equal(getData.success, true);
    assert.equal(getData.count, 1);
    assert.equal(getData.data.length, 1);
    assert.equal(getData.data[0].fullName, 'Vikram Joshi');
    assert.equal(getData.data[0].eventName, 'Technical Symposium');
  });
});
