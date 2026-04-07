const request = require('supertest');
const app = require('../src/app');

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /api/greet', () => {
  it('returns default greeting', async () => {
    const res = await request(app).get('/api/greet');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Hello, World!');
  });

  it('greets by name', async () => {
    const res = await request(app).get('/api/greet?name=Alice');
    expect(res.body.message).toBe('Hello, Alice!');
  });
});

describe('POST /api/echo', () => {
  it('echoes the request body', async () => {
    const payload = { foo: 'bar' };
    const res = await request(app).post('/api/echo').send(payload);
    expect(res.body.received).toEqual(payload);
  });
});
