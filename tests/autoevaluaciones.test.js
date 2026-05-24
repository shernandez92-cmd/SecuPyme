const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app, mongoServer, tokenCliente, tokenAdmin, preguntaId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET  = 'test_secret_123';
  process.env.NODE_ENV    = 'test';
  Object.keys(require.cache).forEach(k => delete require.cache[k]);
  app = require('../src/index');
  await new Promise(r => setTimeout(r, 1000));

  const resAdmin = await request(app)
    .post('/api/auth/registro')
    .send({ nombre: 'Admin AE', email: 'admin@ae.com', contraseña: 'segura123', empresa: 'AdminCo', rol: 'admin' });
  tokenAdmin = resAdmin.body.token;

  const resCliente = await request(app)
    .post('/api/auth/registro')
    .send({ nombre: 'Cliente AE', email: 'cliente@ae.com', contraseña: 'segura123', empresa: 'ClienteCo' });
  tokenCliente = resCliente.body.token;

  // Crear pregunta de prueba
  const resPregunta = await request(app)
    .post('/api/autoevaluaciones/preguntas')
    .set('authorization', tokenAdmin)
    .send({ texto: '¿Tiene firewall instalado?', campo: 'firewall', categoria: 'red', peso: 2 });
  preguntaId = resPregunta.body._id;
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('POST /api/autoevaluaciones/preguntas', () => {
  it('admin puede crear pregunta válida', async () => {
    const res = await request(app)
      .post('/api/autoevaluaciones/preguntas')
      .set('authorization', tokenAdmin)
      .send({ texto: '¿Usa antivirus actualizado?', campo: 'antivirus', categoria: 'sistemas', peso: 3 });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('pregunta');
    expect(res.body.pregunta).toHaveProperty('campo', 'antivirus');
  });

  it('cliente no puede crear pregunta', async () => {
    const res = await request(app)
      .post('/api/autoevaluaciones/preguntas')
      .set('authorization', tokenCliente)
      .send({ texto: '¿Usa antivirus?', campo: 'antivirus2', categoria: 'sistemas', peso: 2 });
    expect(res.status).toBe(403);
  });

  it('rechaza campo con caracteres inválidos', async () => {
    const res = await request(app)
      .post('/api/autoevaluaciones/preguntas')
      .set('authorization', tokenAdmin)
      .send({ texto: '¿Pregunta válida con campo inválido?', campo: 'campo-invalido!', categoria: 'general', peso: 1 });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/autoevaluaciones', () => {
  beforeAll(async () => {
    // Desactivar todas las preguntas y crear solo una conocida
    const Pregunta = require('../src/models/Pregunta');
    await Pregunta.updateMany({}, { activa: false });
    await Pregunta.create({ texto: '¿Test pregunta única?', campo: 'testUnico', categoria: 'general', peso: 2, activa: true, orden: 0 });
  });

  it('cliente puede enviar autoevaluación', async () => {
    const res = await request(app)
      .post('/api/autoevaluaciones')
      .set('authorization', tokenCliente)
      .send({ respuestas: { testUnico: true } });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('puntaje');
    expect(res.body).toHaveProperty('nivelRiesgo');
  });

  it('acepta respuestas string para preguntas abiertas', async () => {
    const res = await request(app)
      .post('/api/autoevaluaciones')
      .set('authorization', tokenAdmin)
      .send({ respuestas: { testUnico: 'respuesta abierta' } });
    expect(res.body).not.toHaveProperty('errores');
  });

  it('sin token retorna 401', async () => {
    const res = await request(app)
      .post('/api/autoevaluaciones')
      .send({ respuestas: { testUnico: true } });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/autoevaluaciones', () => {
  it('devuelve estructura paginada', async () => {
    const res = await request(app)
      .get('/api/autoevaluaciones')
      .set('authorization', tokenCliente);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('autoevaluaciones');
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.autoevaluaciones)).toBe(true);
  });
});

describe('Límite de plan — autoevaluaciones', () => {
  it('plan free bloqueado al superar 1 autoevaluación', async () => {
    // Ya hizo 1 arriba, la segunda debe fallar
    const res = await request(app)
      .post('/api/autoevaluaciones')
      .set('authorization', tokenCliente)
      .send({ respuestas: { testUnico: false } });
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('upgrade', true);
  });
});
