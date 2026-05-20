require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Usuario = require('../models/Usuario');

const generarPassword = () => crypto.randomBytes(12).toString('base64').slice(0, 16);

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const passDemo   = generarPassword();
  const passAdmin  = generarPassword();

  const salt = await bcrypt.genSalt(10);

  await Usuario.findOneAndUpdate(
    { email: 'demo@empresa.com' },
    {
      nombre: 'Empresa Demo',
      email: 'demo@empresa.com',
      contraseña: await bcrypt.hash(passDemo, salt),
      empresa: 'Demo S.A.S',
      rol: 'cliente',
      plan: 'basico'
    },
    { upsert: true }
  );

  await Usuario.findOneAndUpdate(
    { email: 'admin@secupyme.com' },
    {
      nombre: 'Administrador',
      email: 'admin@secupyme.com',
      contraseña: await bcrypt.hash(passAdmin, salt),
      empresa: 'SecuPyme',
      rol: 'admin',
      plan: 'premium'
    },
    { upsert: true }
  );

  console.log('\n=== CREDENCIALES GENERADAS ===');
  console.log('demo@empresa.com   :', passDemo);
  console.log('admin@secupyme.com :', passAdmin);
  console.log('==============================');
  console.log('Guarda estas contraseñas, no se pueden recuperar.\n');

  process.exit();
}).catch(e => { console.log(e); process.exit(); });
