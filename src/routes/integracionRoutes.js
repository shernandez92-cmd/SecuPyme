const express = require('express');
const router = express.Router();
const { checkShodan, checkVirusTotal } = require('../controllers/integracionController');
const { verificarToken } = require('../middleware/auth');

router.get('/shodan/:ip', verificarToken, checkShodan);
router.get('/virustotal/:hash', verificarToken, checkVirusTotal);

module.exports = router;
