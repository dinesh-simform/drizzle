"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postTags = exports.tags = exports.comments = exports.posts = exports.users = exports.roleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// ── Enum ──────────────────────────────────────────
exports.roleEnum = (0, pg_core_1.pgEnum)('role', ['admin', 'user', 'guest']);
// ── Users ─────────────────────────────────────────
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    role: (0, exports.roleEnum)('role').default('user').notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// ── Posts ──────────────────────────────────────────
exports.posts = (0, pg_core_1.pgTable)('posts', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    title: (0, pg_core_1.text)('title').notNull(),
    body: (0, pg_core_1.text)('body'),
    authorId: (0, pg_core_1.integer)('author_id').notNull().references(() => exports.users.id),
    published: (0, pg_core_1.boolean)('published').default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// ── Comments ───────────────────────────────────────
exports.comments = (0, pg_core_1.pgTable)('comments', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    content: (0, pg_core_1.text)('content').notNull(),
    postId: (0, pg_core_1.integer)('post_id').notNull().references(() => exports.posts.id),
    authorId: (0, pg_core_1.integer)('author_id').notNull().references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// ── Tags ───────────────────────────────────────────
exports.tags = (0, pg_core_1.pgTable)('tags', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull().unique(),
});
// ── Post Tags (many-to-many join table) ────────────
exports.postTags = (0, pg_core_1.pgTable)('post_tags', {
    postId: (0, pg_core_1.integer)('post_id').notNull().references(() => exports.posts.id),
    tagId: (0, pg_core_1.integer)('tag_id').notNull().references(() => exports.tags.id),
});
