"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const db_1 = require("./db");
const logger_1 = require("./logger");
const comment_1 = require("./routes/comment");
const comments_1 = require("./routes/comments");
const posttags_1 = require("./routes/posttags");
const posts_1 = require("./routes/posts");
const users_1 = require("./routes/users");
const schema_1 = require("./schema");
const app = (0, express_1.default)();
const port = Number(process.env.PORT ?? 3000);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(logger_1.httpLogger);
app.get('/health', async (_req, res) => {
    try {
        await db_1.db.select().from(schema_1.users).limit(1);
        res.json({ ok: true, db: 'connected' });
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Health check failed');
        res.status(500).json({ ok: false, db: 'disconnected' });
    }
});
app.use('/api/users', users_1.usersRouter);
app.use('/api/posts', posts_1.postsRouter);
app.use('/api/comments', comments_1.commentsRouter);
app.use('/api/posttags', posttags_1.postTagsRouter);
app.use('/api/comment', comment_1.commentRouter);
app.use((err, _req, res, _next) => {
    logger_1.logger.error({ err }, 'Unhandled request error');
    res.status(500).json({ message: 'Internal server error' });
});
app.listen(port, () => {
    logger_1.logger.info({ port, httpLogsEnabled: logger_1.isHttpLoggingEnabled }, 'API server started');
});
