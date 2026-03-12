import { Router, Request, Response } from 'express';
import { and, count, desc, eq, gte, ilike, like, lte } from 'drizzle-orm';
import { db } from '../db';
import { comments,  posts, postTags, tags, users } from '../schema';
import { parseId } from './utils';
import { logger } from '../logger';

export const postsRouter = Router();

postsRouter.get('/', async (_req: Request, res: Response) => {
    const { authorName, title, publishedOn } = _req.query;
    
    const conditions = []

    if (authorName?.length) {
        conditions.push(ilike(users.name, `%${authorName}%`));
    }

    if (title?.length) {
        conditions.push(ilike(posts.title, `%${title}%`));
    }

    if (publishedOn?.length) {
        const publishedDate = new Date(publishedOn as string);
        
        if (isNaN(publishedDate.getTime())) {
            return res.status(422).json({ message: 'Invalid publishedOn date' });
        }

        const startDate = new Date(publishedDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(publishedDate);
        endDate.setHours(23, 59, 59, 999);

        logger.info({ publishedOn, startDate, endDate }, 'Filtering posts by publishedOn date');

        conditions.push(and(
            gte(posts.createdAt, startDate),
            lte(posts.createdAt, endDate)
        ));
    }

    const result = await db
  .select({
    postId: posts.id,
    title: posts.title,
    createdAt: posts.createdAt,
    author: users.name,
    commentsCount: count(comments.id),
  })
  .from(posts)
  .leftJoin(users, eq(posts.authorId, users.id))
  .leftJoin(comments, eq(posts.id, comments.postId))
  .leftJoin(postTags, eq(posts.id, postTags.postId))
  .leftJoin(tags, eq(postTags.tagId, tags.id))
  .where(conditions.length ? and(...conditions) : undefined)
  .groupBy(posts.id, users.id)
  .orderBy(desc(posts.id));
    

    res.json(result);

});

postsRouter.get('/:id', async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid id' });
    }

    const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    return res.json(post);
});

postsRouter.post('/', async (req: Request, res: Response) => {
    const { title, body, authorId, published } = req.body as {
        title?: string;
        body?: string;
        authorId?: number;
        published?: boolean;
    };

    if (!title || typeof authorId !== 'number') {
        return res.status(400).json({ message: 'title and authorId are required' });
    }

    const [created] = await db
        .insert(posts)
        .values({
            title,
            body: body ?? null,
            authorId,
            published: published ?? false,
        })
        .returning();

    return res.status(201).json(created);
});

postsRouter.patch('/:id', async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid id' });
    }

    const payload = req.body as {
        title?: string;
        body?: string;
        authorId?: number;
        published?: boolean;
    };

    const [updated] = await db
        .update(posts)
        .set(payload)
        .where(eq(posts.id, id))
        .returning();

    if (!updated) {
        return res.status(404).json({ message: 'Post not found' });
    }

    return res.json(updated);
});

postsRouter.delete('/:id', async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid id' });
    }

    const [deleted] = await db.delete(posts).where(eq(posts.id, id)).returning();
    if (!deleted) {
        return res.status(404).json({ message: 'Post not found' });
    }

    return res.json(deleted);
});
