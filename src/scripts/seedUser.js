require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const salt = await bcrypt.genSalt(10);
  const contraseña = await bcrypt.hash('123456', salt);
  
  await Usuario.findOneAndUpdate(
    { email: 'demo@empresa.com' },
    { nombre: 'Empresa Demo', email: 'demo@empresa.com', contraseña, empresa: 'Demo S.A.S', rol: 'cliente' },
    { upsert: true }
  );
  
  console.log('Usuario demo creado: demo@empresa.com / 123456');
  process.exit();
}).catch(e => { console.log(e); process.exit(); });
