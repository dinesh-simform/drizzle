# Drizzle Learning — Express + PostgreSQL

A small learning project demonstrating Drizzle ORM with PostgreSQL, plus a minimal Express API to exercise queries and migrations.

## What this repo contains

- TypeScript Express API wired to Drizzle ORM (`pg` driver)
- Schema definitions in `src/schema.ts` using `drizzle-orm/pg-core`
- Route modules for `users`, `posts`, `comments`, `posttags` in `src/routes/`
- Structured logging with `pino` and optional request logging via `pino-http`
- `drizzle-kit` configuration for generating and running migrations
- Example seed script and utilities to help test queries

## Quick Start

Prerequisites:
- Node 18+ (or compatible)
- PostgreSQL accessible with a connection URL

1. Install dependencies

```bash
npm install
```

2. Create a `.env` in the project root with at least:

```
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
PORT=3000
```

3. Run migrations (generate first if you edited `src/schema.ts`)

```bash
# generate migration SQL from schema
npx drizzle-kit generate

# apply migrations
npx drizzle-kit migrate

# (dev-only) push schema directly
npx drizzle-kit push
```

4. Start dev server

```bash
# runs ts-node for quick development
npm run dev
```

Build and run production bundle

```bash
npm run build
npm run start
```

## Environment variables (optional)

- `DATABASE_URL` — required, Postgres connection string
- `PORT` — port for the Express server (default 3000)
- `LOG_LEVEL` — `debug|info|warn|error` (default `info`)
- `NODE_ENV` — `production` enables production logger config
- `HTTP_LOGS_ENABLED` — set to `true` to enable `pino-http` automatic per-request logs (disabled by default)

## API Endpoints

Health
- `GET /health` — check DB connectivity

Users
- `GET /api/users` — list users (supports `page` and `size` query params plus `roles` comma-separated filter)
- `GET /api/users/:id` — get user
- `POST /api/users` — create user (body: `name`, `email`, `role`)
- `PATCH /api/users/:id` — update user
- `DELETE /api/users/:id` — delete user

Posts
- `GET /api/posts` — list posts (supports `author` query to filter by author name)
- `GET /api/posts/:id` — get post
- `POST /api/posts` — create post (body: `title`, `body`, `authorId`, `published`)
- `PATCH /api/posts/:id` — update post
- `DELETE /api/posts/:id` — delete post

Comments
- `GET /api/comments` — list comments
- `GET /api/comments/:id` — get comment
- `POST /api/comments` — create comment (body: `content`, `postId`, `authorId`)
- `PATCH /api/comments/:id` — update comment
- `DELETE /api/comments/:id` — delete comment

PostTags
- `GET /api/posttags` — list post-tag relations
- `GET /api/posttags/:postId/:tagId` — get relation
- `POST /api/posttags` — create relation (body: `postId`, `tagId`)
- `DELETE /api/posttags/:postId/:tagId` — delete relation

## Notes & Best Practices

- Automatic per-request logging via `pino-http` is opt-in via `HTTP_LOGS_ENABLED=true`. This avoids noisy logs during interactive testing.
- Prefer `req.log.<level>()` (available from `pino-http`) or the shared `logger` when you need structured logs inside handlers. Avoid `console.log` for production code.
- Be careful when filtering by joined fields (e.g., filtering posts by `users.name`) — placing the condition in `WHERE` can turn a `LEFT JOIN` into an inner join, filtering out rows with no match.
- Use `drizzle-kit` for safe schema migrations rather than `push` in production.

## Project structure

- `src/db.ts` — Drizzle connection (`drizzle(pool)`) using `pg` Pool
- `src/schema.ts` — all table definitions
- `src/logger.ts` — pino + pino-http configuration
- `src/main.ts` — Express server and route mounts
- `src/routes/*` — modular route handlers per resource
- `drizzle.config.ts` — drizzle-kit config

## Useful commands

```bash
# generate migrations from schema
npx drizzle-kit generate

# apply migrations
npx drizzle-kit migrate

# push schema directly (dev only)
npx drizzle-kit push

# run seed (if present)
# npx ts-node src/seed.ts
```

## Table Schemas

The project schema is defined in `src/schema.ts` using `drizzle-orm/pg-core`. Below are the tables and columns (approximate Drizzle types) implemented in this repo.

- **users**
	- `id` : serial primary key
	- `name` : varchar(100)
	- `email` : text unique
	- `role` : enum('admin','user','guest')
	- `is_active` : boolean default true
	- `created_at` : timestamp default now()
	- `updated_at` : timestamp default now()

	Drizzle example:

	```ts
	export const users = pgTable('users', {
		id: serial('id').primaryKey(),
		name: varchar('name', { length: 100 }).notNull(),
		email: text('email').notNull().unique(),
		role: roleEnum('role').default('user').notNull(),
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	});
	```

- **posts**
	- `id` : serial primary key
	- `title` : text
	- `body` : text (nullable)
	- `author_id` : integer -> references `users.id`
	- `published` : boolean default false
	- `created_at` : timestamp default now()

	Drizzle example:

	```ts
	export const posts = pgTable('posts', {
		id: serial('id').primaryKey(),
		title: text('title').notNull(),
		body: text('body'),
		authorId: integer('author_id').notNull().references(() => users.id),
		published: boolean('published').default(false).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	});
	```

- **comments**
	- `id` : serial primary key
	- `content` : text
	- `post_id` : integer -> references `posts.id`
	- `author_id` : integer -> references `users.id`
	- `created_at` : timestamp default now()

	```ts
	export const comments = pgTable('comments', {
		id: serial('id').primaryKey(),
		content: text('content').notNull(),
		postId: integer('post_id').notNull().references(() => posts.id),
		authorId: integer('author_id').notNull().references(() => users.id),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	});
	```

- **tags**
	- `id` : serial primary key
	- `name` : text unique

	```ts
	export const tags = pgTable('tags', {
		id: serial('id').primaryKey(),
		name: text('name').notNull().unique(),
	});
	```

- **post_tags** (join table)
	- `post_id` : integer -> references `posts.id`
	- `tag_id` : integer -> references `tags.id`

	```ts
	export const postTags = pgTable('post_tags', {
		postId: integer('post_id').notNull().references(() => posts.id),
		tagId: integer('tag_id').notNull().references(() => tags.id),
	});
	```

These definitions match `src/schema.ts`. Use `npx drizzle-kit generate` to create migration SQL whenever you change the schema.
