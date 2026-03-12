import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  varchar,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ── Enum ──────────────────────────────────────────
export const roleEnum = pgEnum('role', ['admin', 'user', 'guest']);

// ── Users ─────────────────────────────────────────
export const users = pgTable('users', {
  id:        serial('id').primaryKey(),
  name:      varchar('name', { length: 100 }).notNull(),
  email:     text('email').notNull().unique(),
  role:      roleEnum('role').default('user').notNull(),
  isActive:  boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Posts ──────────────────────────────────────────
export const posts = pgTable('posts', {
  id:        serial('id').primaryKey(),
  title:     text('title').notNull(),
  body:      text('body'),
  authorId:  integer('author_id').notNull().references(() => users.id),
  published: boolean('published').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Comments ───────────────────────────────────────
export const comments = pgTable('comments', {
  id:        serial('id').primaryKey(),
  content:   text('content').notNull(),
  postId:    integer('post_id').notNull().references(() => posts.id),
  authorId:  integer('author_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Tags ───────────────────────────────────────────
export const tags = pgTable('tags', {
  id:   serial('id').primaryKey(),
  name: text('name').notNull().unique(),
});

// ── Post Tags (many-to-many join table) ────────────
export const postTags = pgTable('post_tags', {
  postId: integer('post_id').notNull().references(() => posts.id),
  tagId:  integer('tag_id').notNull().references(() => tags.id),
});