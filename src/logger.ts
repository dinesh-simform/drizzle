import pino from 'pino';
import pinoHttp from 'pino-http';

const level = process.env.LOG_LEVEL ?? 'info';
const isProduction = process.env.NODE_ENV === 'production';
export const isHttpLoggingEnabled = false

const loggerOptions: pino.LoggerOptions = {
  level,
  base: { service: 'drizzle-learning-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            singleLine: false,
          },
        },
      }),
};

export const logger = pino(loggerOptions);

export const httpLogger = pinoHttp({
  ...loggerOptions,
  autoLogging: isHttpLoggingEnabled,
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  },
});