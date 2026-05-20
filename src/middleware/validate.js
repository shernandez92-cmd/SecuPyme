const { ZodError } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        mensaje: 'Datos inválidos',
        errores: err.errors.map(e => ({
          campo: e.path.join('.'),
          mensaje: e.message,
        })),
      });
    }
    next(err);
  }
};

module.exports = validate;
