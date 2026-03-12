"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentsRouter = void 0;
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema_1 = require("../schema");
const utils_1 = require("./utils");
exports.commentsRouter = (0, express_1.Router)();
exports.commentsRouter.get('/', async (_req, res) => {
    const result = await db_1.db.select().from(schema_1.comments).orderBy((0, drizzle_orm_1.desc)(schema_1.comments.id));
    res.json(result);
});
exports.commentsRouter.get('/:id', async (req, res) => {
    const id = (0, utils_1.parseId)(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid id' });
    }
    const [comment] = await db_1.db.select().from(schema_1.comments).where((0, drizzle_orm_1.eq)(schema_1.comments.id, id)).limit(1);
    if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
    }
    return res.json(comment);
});
exports.commentsRouter.post('/', async (req, res) => {
    const { content, postId, authorId } = req.body;
    if (!content || typeof postId !== 'number' || typeof authorId !== 'number') {
        return res.status(400).json({ message: 'content, postId and authorId are required' });
    }
    const [created] = await db_1.db
        .insert(schema_1.comments)
        .values({ content, postId, authorId })
        .returning();
    return res.status(201).json(created);
});
exports.commentsRouter.patch('/:id', async (req, res) => {
    const id = (0, utils_1.parseId)(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid id' });
    }
    const payload = req.body;
    const [updated] = await db_1.db
        .update(schema_1.comments)
        .set(payload)
        .where((0, drizzle_orm_1.eq)(schema_1.comments.id, id))
        .returning();
    if (!updated) {
        return res.status(404).json({ message: 'Comment not found' });
    }
    return res.json(updated);
});
exports.commentsRouter.delete('/:id', async (req, res) => {
    const id = (0, utils_1.parseId)(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid id' });
    }
    const [deleted] = await db_1.db.delete(schema_1.comments).where((0, drizzle_orm_1.eq)(schema_1.comments.id, id)).returning();
    if (!deleted) {
        return res.status(404).json({ message: 'Comment not found' });
    }
    return res.json(deleted);
});
