const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app, mongoServer, token;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET  = 'test_secret_123';
  process.env.NODE_ENV    = 'test';
  // Cerrar TODAS las conexiones mongoose activas antes de requerir el app
  await mongoose.disconnect();
  for (const key of Object.keys(require.cache)) {
    if (key.includes('mongoose') || key.includes('index') || key.includes('models') || key.includes('controllers') || key.includes('middleware') || key.includes('routes')) {
      delete require.cache[key];
    }
  }
  app = require('../src/index');
  await new Promise(r => setTimeout(r, 2000));

  const res = await request(app)
    .post('/api/auth/registro')
    .send({ nombre: 'Key User', email: 'key@empresa.com', contraseña: 'segura123', empresa: 'KeyCo' });
  token = res.body.token;
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('API Key management', () => {
  let rawKey;

  it('GET /status sin key — tieneKey false', async () => {
    const res = await request(app)
      .get('/api/auth/apikey/status')
      .set('authorization', token);
    expect(res.status).toBe(200);
    expect(res.body.tieneKey).toBe(false);
  });

  it('POST /apikey genera key y la devuelve una vez', async () => {
    const res = await request(app)
      .post('/api/auth/apikey')
      .set('authorization', token);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('apiKey');
    rawKey = res.body.apiKey;
  });

  it('GET /status con key — tieneKey true', async () => {
    const res = await request(app)
      .get('/api/auth/apikey/status')
      .set('authorization', token);
    expect(res.status).toBe(200);
    expect(res.body.tieneKey).toBe(true);
  });

  it('DELETE /apikey revoca la key', async () => {
    const res = await request(app)
      .delete('/api/auth/apikey')
      .set('authorization', token);
    expect(res.status).toBe(200);
  });

  it('GET /status tras revocar — tieneKey false', async () => {
    const res = await request(app)
      .get('/api/auth/apikey/status')
      .set('authorization', token);
    expect(res.status).toBe(200);
    expect(res.body.tieneKey).toBe(false);
  });

  it('sin token retorna 401', async () => {
    const res = await request(app).post('/api/auth/apikey');
    expect(res.status).toBe(401);
  });
});
