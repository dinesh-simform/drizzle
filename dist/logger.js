"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpLogger = exports.logger = exports.isHttpLoggingEnabled = void 0;
const pino_1 = __importDefault(require("pino"));
const pino_http_1 = __importDefault(require("pino-http"));
const level = process.env.LOG_LEVEL ?? 'info';
const isProduction = process.env.NODE_ENV === 'production';
exports.isHttpLoggingEnabled = process.env.HTTP_LOGS_ENABLED === 'true';
const loggerOptions = {
    level,
    base: { service: 'drizzle-learning-api' },
    timestamp: pino_1.default.stdTimeFunctions.isoTime,
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
exports.logger = (0, pino_1.default)(loggerOptions);
exports.httpLogger = (0, pino_http_1.default)({
    ...loggerOptions,
    autoLogging: exports.isHttpLoggingEnabled,
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
