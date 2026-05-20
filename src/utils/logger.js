const { createLogger, format, transports } = require('winston');

const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
  return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug'),
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    process.env.NODE_ENV !== 'production'
      ? combine(colorize(), logFormat)
      : format.json()
  ),
  transports: [
    new transports.Console(),
  ],
  silent: process.env.NODE_ENV === 'test',
});

module.exports = logger;
