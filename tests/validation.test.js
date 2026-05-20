const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app, mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test_secret_123';
  process.env.NODE_ENV = 'test';
  Object.keys(require.cache).forEach(k => delete require.cache[k]);
  app = require('../src/index');
  await new Promise(r => setTimeout(r, 1000));
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Validación de inputs — registro', () => {
  it('rechaza email inválido', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Test', email: 'no-es-email', contraseña: 'segura123', empresa: 'Co' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errores');
  });

  it('rechaza contraseña menor a 8 caracteres', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Test', email: 'test@co.com', contraseña: '123', empresa: 'Co' });
    expect(res.status).toBe(400);
    expect(res.body.errores.some(e => e.campo === 'contraseña')).toBe(true);
  });

  it('rechaza body vacío', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errores');
  });

  it('rechaza nombre muy corto', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'A', email: 'test@co.com', contraseña: 'segura123', empresa: 'Co' });
    expect(res.status).toBe(400);
  });
});

describe('Validación de inputs — login', () => {
  it('rechaza body vacío', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errores');
  });

  it('rechaza email inválido', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'malformado', contraseña: 'algo' });
    expect(res.status).toBe(400);
  });
});

describe('Validación de inputs — forgot-password', () => {
  it('rechaza body vacío', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({});
    expect(res.status).toBe(400);
  });

  it('rechaza email inválido', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'noesvalido' });
    expect(res.status).toBe(400);
  });
});

describe('Validación de inputs — reset-password', () => {
  it('rechaza body vacío', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({});
    expect(res.status).toBe(400);
  });

  it('rechaza nueva contraseña menor a 8 chars', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'abc123', nuevaContraseña: '123' });
    expect(res.status).toBe(400);
  });
});
