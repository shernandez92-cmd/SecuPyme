const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test_secret_123';
  process.env.CRON_SECRET = 'test_cron_secret';
  process.env.NODE_ENV = 'test';

  Object.keys(require.cache).forEach(k => delete require.cache[k]);
  app = require('../src/index');

  await new Promise(resolve => setTimeout(resolve, 1000));
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('POST /api/auth/registro', () => {
  it('registra un usuario nuevo correctamente', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Test User', email: 'test@empresa.com', contraseña: 'segura123', empresa: 'TestCo' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  it('rechaza email duplicado', async () => {
    await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Test User', email: 'dup@empresa.com', contraseña: 'segura123', empresa: 'TestCo' });

    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Test User', email: 'dup@empresa.com', contraseña: 'segura123', empresa: 'TestCo' });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/ya está registrado/i);
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Login User', email: 'login@empresa.com', contraseña: 'segura123', empresa: 'TestCo' });
  });

  it('login exitoso devuelve token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@empresa.com', contraseña: 'segura123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('rol');
  });

  it('rechaza contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@empresa.com', contraseña: 'incorrecta' });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/credenciales/i);
  });

  it('rechaza email inexistente', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@empresa.com', contraseña: 'segura123' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/logout', () => {
  it('revoca el token correctamente', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@empresa.com', contraseña: 'segura123' });
    const token = loginRes.body.token;

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('authorization', token);
    expect(logoutRes.status).toBe(200);

    const res = await request(app)
      .get('/api/reportes')
      .set('authorization', token);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('responde igual para email existente y no existente', async () => {
    const res1 = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'login@empresa.com' });

    const res2 = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'noexiste@empresa.com' });

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.body.mensaje).toBe(res2.body.mensaje);
  });

  it('rechaza si falta el email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/reset-password', () => {
  it('rechaza token inválido', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'tokenfalso', nuevaContraseña: 'nueva1234' });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/inválido|expirado/i);
  });

  it('rechaza si faltan campos', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/siem/cron/monitoreo', () => {
  it('rechaza sin CRON_SECRET', async () => {
    const res = await request(app)
      .post('/api/siem/cron/monitoreo');
    expect(res.status).toBe(401);
  });

  it('rechaza con CRON_SECRET incorrecto', async () => {
    const res = await request(app)
      .post('/api/siem/cron/monitoreo')
      .set('x-cron-secret', 'incorrecto');
    expect(res.status).toBe(401);
  });
});
