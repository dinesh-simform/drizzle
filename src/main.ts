import cors from 'cors';
import express, { Request, Response } from 'express';
import { db } from './db';
import { httpLogger, isHttpLoggingEnabled, logger } from './logger';
import { commentRouter } from './routes/comment';
import { commentsRouter } from './routes/comments';
import { postTagsRouter } from './routes/posttags';
import { postsRouter } from './routes/posts';
import { usersRouter } from './routes/users';
import { users } from './schema';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());
app.use(httpLogger);

app.get('/health', async (_req: Request, res: Response) => {
  try {
    await db.select().from(users).limit(1);
    res.json({ ok: true, db: 'connected' });
  } catch (error) {
    logger.error({ err: error }, 'Health check failed');
    res.status(500).json({ ok: false, db: 'disconnected' });
  }
});

app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/posttags', postTagsRouter);
app.use('/api/comment', commentRouter);

app.use((err: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled request error');
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(port, () => {
  logger.info({ port, httpLogsEnabled: isHttpLoggingEnabled }, 'API server started');
});
