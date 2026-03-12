"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema_1 = require("../schema");
const utils_1 = require("./utils");
exports.usersRouter = (0, express_1.Router)();
exports.usersRouter.get('/', async (_req, res) => {
    const result = await db_1.db.select().from(schema_1.users).orderBy((0, drizzle_orm_1.desc)(schema_1.users.id));
    res.json(result);
});
exports.usersRouter.get('/:id', async (req, res) => {
    const id = (0, utils_1.parseId)(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid id' });
    }
    const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id)).limit(1);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
});
exports.usersRouter.post('/', async (req, res) => {
    const { name, email, role } = req.body;
    if (!name || !email) {
        return res.status(400).json({ message: 'name and email are required' });
    }
    const [created] = await db_1.db
        .insert(schema_1.users)
        .values({ name, email, role: role ?? 'user' })
        .returning();
    return res.status(201).json(created);
});
exports.usersRouter.patch('/:id', async (req, res) => {
    const id = (0, utils_1.parseId)(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid id' });
    }
    const payload = req.body;
    const [updated] = await db_1.db
        .update(schema_1.users)
        .set({ ...payload, updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
        .returning();
    if (!updated) {
        return res.status(404).json({ message: 'User not found' });
    }
    return res.json(updated);
});
exports.usersRouter.delete('/:id', async (req, res) => {
    const id = (0, utils_1.parseId)(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid id' });
    }
    const [deleted] = await db_1.db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id)).returning();
    if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
    }
    return res.json(deleted);
});
