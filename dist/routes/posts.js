"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postsRouter = void 0;
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema_1 = require("../schema");
const utils_1 = require("./utils");
exports.postsRouter = (0, express_1.Router)();
exports.postsRouter.get('/', async (_req, res) => {
    console.log('Fetching all posts');
    console.log("_req", _req.query);
    const result = await db_1.db.select().from(schema_1.posts).orderBy((0, drizzle_orm_1.desc)(schema_1.posts.id));
    res.json(result);
});
exports.postsRouter.get('/:id', async (req, res) => {
    const id = (0, utils_1.parseId)(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid id' });
    }
    const [post] = await db_1.db.select().from(schema_1.posts).where((0, drizzle_orm_1.eq)(schema_1.posts.id, id)).limit(1);
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }
    return res.json(post);
});
exports.postsRouter.post('/', async (req, res) => {
    const { title, body, authorId, published } = req.body;
    if (!title || typeof authorId !== 'number') {
        return res.status(400).json({ message: 'title and authorId are required' });
    }
    const [created] = await db_1.db
        .insert(schema_1.posts)
        .values({
        title,
        body: body ?? null,
        authorId,
        published: published ?? false,
    })
        .returning();
    return res.status(201).json(created);
});
exports.postsRouter.patch('/:id', async (req, res) => {
    const id = (0, utils_1.parseId)(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid id' });
    }
    const payload = req.body;
    const [updated] = await db_1.db
        .update(schema_1.posts)
        .set(payload)
        .where((0, drizzle_orm_1.eq)(schema_1.posts.id, id))
        .returning();
    if (!updated) {
        return res.status(404).json({ message: 'Post not found' });
    }
    return res.json(updated);
});
exports.postsRouter.delete('/:id', async (req, res) => {
    const id = (0, utils_1.parseId)(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid id' });
    }
    const [deleted] = await db_1.db.delete(schema_1.posts).where((0, drizzle_orm_1.eq)(schema_1.posts.id, id)).returning();
    if (!deleted) {
        return res.status(404).json({ message: 'Post not found' });
    }
    return res.json(deleted);
});
