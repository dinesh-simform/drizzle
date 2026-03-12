import { Router, Request, Response } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { postTags } from '../schema';
import { parseId } from './utils';

export const postTagsRouter = Router();

postTagsRouter.get('/', async (_req: Request, res: Response) => {
  const result = await db.select().from(postTags);
  res.json(result);
});

postTagsRouter.get('/:postId/:tagId', async (req: Request, res: Response) => {
  const postId = parseId(req.params.postId);
  const tagId = parseId(req.params.tagId);
  if (postId === null || tagId === null) {
    return res.status(400).json({ message: 'Invalid postId or tagId' });
  }

  const [row] = await db
    .select()
    .from(postTags)
    .where(and(eq(postTags.postId, postId), eq(postTags.tagId, tagId)))
    .limit(1);

  if (!row) {
    return res.status(404).json({ message: 'Post tag relation not found' });
  }

  return res.json(row);
});

postTagsRouter.post('/', async (req: Request, res: Response) => {
  const { postId, tagId } = req.body as { postId?: number; tagId?: number };

  if (typeof postId !== 'number' || typeof tagId !== 'number') {
    return res.status(400).json({ message: 'postId and tagId are required' });
  }

  const [created] = await db
    .insert(postTags)
    .values({ postId, tagId })
    .returning();

  return res.status(201).json(created);
});

postTagsRouter.delete('/:postId/:tagId', async (req: Request, res: Response) => {
  const postId = parseId(req.params.postId);
  const tagId = parseId(req.params.tagId);
  if (postId === null || tagId === null) {
    return res.status(400).json({ message: 'Invalid postId or tagId' });
  }

  const [deleted] = await db
    .delete(postTags)
    .where(and(eq(postTags.postId, postId), eq(postTags.tagId, tagId)))
    .returning();

  if (!deleted) {
    return res.status(404).json({ message: 'Post tag relation not found' });
  }

  return res.json(deleted);
});
