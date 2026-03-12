"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postTagsRouter = void 0;
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema_1 = require("../schema");
const utils_1 = require("./utils");
exports.postTagsRouter = (0, express_1.Router)();
exports.postTagsRouter.get('/', async (_req, res) => {
    const result = await db_1.db.select().from(schema_1.postTags);
    res.json(result);
});
exports.postTagsRouter.get('/:postId/:tagId', async (req, res) => {
    const postId = (0, utils_1.parseId)(req.params.postId);
    const tagId = (0, utils_1.parseId)(req.params.tagId);
    if (postId === null || tagId === null) {
        return res.status(400).json({ message: 'Invalid postId or tagId' });
    }
    const [row] = await db_1.db
        .select()
        .from(schema_1.postTags)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.postTags.postId, postId), (0, drizzle_orm_1.eq)(schema_1.postTags.tagId, tagId)))
        .limit(1);
    if (!row) {
        return res.status(404).json({ message: 'Post tag relation not found' });
    }
    return res.json(row);
});
exports.postTagsRouter.post('/', async (req, res) => {
    const { postId, tagId } = req.body;
    if (typeof postId !== 'number' || typeof tagId !== 'number') {
        return res.status(400).json({ message: 'postId and tagId are required' });
    }
    const [created] = await db_1.db
        .insert(schema_1.postTags)
        .values({ postId, tagId })
        .returning();
    return res.status(201).json(created);
});
exports.postTagsRouter.delete('/:postId/:tagId', async (req, res) => {
    const postId = (0, utils_1.parseId)(req.params.postId);
    const tagId = (0, utils_1.parseId)(req.params.tagId);
    if (postId === null || tagId === null) {
        return res.status(400).json({ message: 'Invalid postId or tagId' });
    }
    const [deleted] = await db_1.db
        .delete(schema_1.postTags)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.postTags.postId, postId), (0, drizzle_orm_1.eq)(schema_1.postTags.tagId, tagId)))
        .returning();
    if (!deleted) {
        return res.status(404).json({ message: 'Post tag relation not found' });
    }
    return res.json(deleted);
});
