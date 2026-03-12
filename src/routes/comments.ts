import { Router, Request, Response } from 'express';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { comments } from '../schema';
import { parseId } from './utils';

export const commentsRouter = Router();

commentsRouter.get('/', async (_req: Request, res: Response) => {
    const result = await db.select().from(comments).orderBy(desc(comments.id));
    res.json(result);
});

commentsRouter.get('/:id', async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid id' });
    }

    const [comment] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
    if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
    }

    return res.json(comment);
});

commentsRouter.post('/', async (req: Request, res: Response) => {
    const { content, postId, authorId } = req.body as {
        content?: string;
        postId?: number;
        authorId?: number;
    };

    if (!content || typeof postId !== 'number' || typeof authorId !== 'number') {
        return res.status(400).json({ message: 'content, postId and authorId are required' });
    }

    const [created] = await db
        .insert(comments)
        .values({ content, postId, authorId })
        .returning();

    return res.status(201).json(created);
});

commentsRouter.patch('/:id', async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid id' });
    }

    const payload = req.body as {
        content?: string;
        postId?: number;
        authorId?: number;
    };

    const [updated] = await db
        .update(comments)
        .set(payload)
        .where(eq(comments.id, id))
        .returning();

    if (!updated) {
        return res.status(404).json({ message: 'Comment not found' });
    }

    return res.json(updated);
});

commentsRouter.delete('/:id', async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid id' });
    }

    const [deleted] = await db.delete(comments).where(eq(comments.id, id)).returning();
    if (!deleted) {
        return res.status(404).json({ message: 'Comment not found' });
    }

    return res.json(deleted);
});
