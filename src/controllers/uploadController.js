const logger = require('../utils/logger');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes y PDFs'));
    }
  }
});

const subirArchivo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ mensaje: 'No se envió archivo' });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'secupyme',
          resource_type: req.file.mimetype === 'application/pdf' ? 'raw' : 'image'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    res.json({
      url: result.secure_url,
      tipo: req.file.mimetype,
      nombre: req.file.originalname,
      tamaño: req.file.size
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error subiendo archivo', error: error.message });
  }
};

module.exports = { upload, subirArchivo };
