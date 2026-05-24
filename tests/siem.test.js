const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const crypto = require('crypto');

let app, mongoServer, tokenAdmin, tokenCliente, apiKey;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI  = mongoServer.getUri();
  process.env.JWT_SECRET   = 'test_secret_123';
  process.env.CRON_SECRET  = 'test_cron_secret';
  process.env.NODE_ENV     = 'test';
  // Cerrar TODAS las conexiones mongoose activas antes de requerir el app
  await mongoose.disconnect();
  for (const key of Object.keys(require.cache)) {
    if (key.includes('mongoose') || key.includes('index') || key.includes('models') || key.includes('controllers') || key.includes('middleware') || key.includes('routes')) {
      delete require.cache[key];
    }
  }
  app = require('../src/index');
  await new Promise(r => setTimeout(r, 2000));

  const resAdmin = await request(app)
    .post('/api/auth/registro')
    .send({ nombre: 'Admin SIEM', email: 'admin@siem.com', contraseña: 'segura123', empresa: 'AdminCo', rol: 'admin' });
  tokenAdmin = resAdmin.body.token;
  if (!tokenAdmin) throw new Error('Admin registro falló: ' + JSON.stringify(resAdmin.body));

  const resCliente = await request(app)
    .post('/api/auth/registro')
    .send({ nombre: 'Cliente SIEM', email: 'cliente@siem.com', contraseña: 'segura123', empresa: 'ClienteCo' });
  tokenCliente = resCliente.body.token;
  if (!tokenCliente) throw new Error('Cliente registro falló: ' + JSON.stringify(resCliente.body));

  // Generar API key
  const resKey = await request(app)
    .post('/api/auth/apikey')
    .set('authorization', tokenCliente);
  apiKey = resKey.body.apiKey;
  if (!apiKey) throw new Error('API key generation falló: ' + JSON.stringify(resKey.body));
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('GET /api/siem/events', () => {
  it('admin puede obtener eventos', async () => {
    const res = await request(app)
      .get('/api/siem/events')
      .set('authorization', tokenAdmin);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('eventos');
    expect(Array.isArray(res.body.eventos)).toBe(true);
  });

  it('cliente no puede acceder', async () => {
    const res = await request(app)
      .get('/api/siem/events')
      .set('authorization', tokenCliente);
    expect(res.status).toBe(403);
  });

  it('sin token retorna 401', async () => {
    const res = await request(app).get('/api/siem/events');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/siem/external/events', () => {
  it('acepta evento externo válido con api key', async () => {
    const res = await request(app)
      .post('/api/siem/external/events')
      .set('x-api-key', apiKey)
      .send({ description: 'Intrusión detectada en servidor', severity: 'high' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('mensaje');
    expect(res.body).toHaveProperty('id');
  });

  it('rechaza severidad inválida', async () => {
    const res = await request(app)
      .post('/api/siem/external/events')
      .set('x-api-key', apiKey)
      .send({ description: 'Evento de prueba', severity: 'critico' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errores');
  });

  it('rechaza sin description', async () => {
    const res = await request(app)
      .post('/api/siem/external/events')
      .set('x-api-key', apiKey)
      .send({ severity: 'low' });
    expect(res.status).toBe(400);
  });

  it('rechaza sin api key', async () => {
    const res = await request(app)
      .post('/api/siem/external/events')
      .send({ description: 'Test', severity: 'low' });
    expect(res.status).toBe(401);
  });

  it('rechaza api key inválida', async () => {
    const res = await request(app)
      .post('/api/siem/external/events')
      .set('x-api-key', 'keyfalsa123')
      .send({ description: 'Test', severity: 'low' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/siem/estadisticas', () => {
  it('admin obtiene estadísticas', async () => {
    const res = await request(app)
      .get('/api/siem/estadisticas')
      .set('authorization', tokenAdmin);
    expect(res.status).toBe(200);
  });

  it('cliente no puede acceder', async () => {
    const res = await request(app)
      .get('/api/siem/estadisticas')
      .set('authorization', tokenCliente);
    expect(res.status).toBe(403);
  });
});
