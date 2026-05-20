const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app, mongoServer, tokenFree, tokenAdmin;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET  = 'test_secret_123';
  process.env.NODE_ENV    = 'test';
  Object.keys(require.cache).forEach(k => delete require.cache[k]);
  app = require('../src/index');
  await new Promise(r => setTimeout(r, 1000));

  // Registrar usuario free
  const resFree = await request(app)
    .post('/api/auth/registro')
    .send({ nombre: 'Free User', email: 'free@empresa.com', contraseña: 'segura123', empresa: 'FreeCo' });
  tokenFree = resFree.body.token;

  // Registrar admin
  const resAdmin = await request(app)
    .post('/api/auth/registro')
    .send({ nombre: 'Admin User', email: 'admin@empresa.com', contraseña: 'segura123', empresa: 'AdminCo', rol: 'admin' });
  tokenAdmin = resAdmin.body.token;
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('POST /api/reportes', () => {
  it('crea un reporte válido', async () => {
    const res = await request(app)
      .post('/api/reportes')
      .set('authorization', tokenFree)
      .send({ tipoVulnerabilidad: 'phishing', descripcion: 'Recibí un correo sospechoso de suplantación' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('reporte');
  });

  it('rechaza descripción muy corta', async () => {
    const res = await request(app)
      .post('/api/reportes')
      .set('authorization', tokenFree)
      .send({ tipoVulnerabilidad: 'phishing', descripcion: 'corto' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errores');
  });

  it('rechaza sin autenticación', async () => {
    const res = await request(app)
      .post('/api/reportes')
      .send({ tipoVulnerabilidad: 'malware', descripcion: 'descripción suficientemente larga para pasar' });
    expect(res.status).toBe(401);
  });

  it('bloquea plan free al superar límite de 3 reportes', async () => {
    // Ya creó 1 arriba, crear 2 más para llegar al límite
    for (let i = 0; i < 2; i++) {
      await request(app)
        .post('/api/reportes')
        .set('authorization', tokenFree)
        .send({ tipoVulnerabilidad: 'malware', descripcion: `Descripción del reporte extra número ${i + 1}` });
    }
    // El 4to debe fallar
    const res = await request(app)
      .post('/api/reportes')
      .set('authorization', tokenFree)
      .send({ tipoVulnerabilidad: 'ransomware', descripcion: 'Este reporte debería ser bloqueado por el plan' });
    expect(res.status).toBe(403);
    expect(res.body.upgrade).toBe(true);
  });
});

describe('GET /api/reportes', () => {
  it('devuelve estructura paginada', async () => {
    const res = await request(app)
      .get('/api/reportes')
      .set('authorization', tokenFree);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reportes');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('pages');
    expect(Array.isArray(res.body.reportes)).toBe(true);
  });

  it('admin ve todos los reportes', async () => {
    const res = await request(app)
      .get('/api/reportes')
      .set('authorization', tokenAdmin);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(3);
  });
});
