const express = require('express');
const router = express.Router();
const { checkShodan } = require('../controllers/integracionController');
const { verificarToken } = require('../middleware/auth');

router.get('/shodan/:ip', verificarToken, checkShodan);

module.exports = router;
