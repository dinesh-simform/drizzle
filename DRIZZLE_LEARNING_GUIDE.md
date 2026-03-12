# Drizzle ORM + PostgreSQL — Complete Learning Guide

> A step-by-step reference covering every major aspect of Drizzle ORM with the `pg` driver.

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Database Connection](#2-database-connection)
3. [Schema Definition](#3-schema-definition)
4. [Migrations with drizzle-kit](#4-migrations-with-drizzle-kit)
5. [Insert Queries](#5-insert-queries)
6. [Select Queries](#6-select-queries)
7. [Update Queries](#7-update-queries)
8. [Delete Queries](#8-delete-queries)
9. [Filtering & Operators](#9-filtering--operators)
10. [Ordering, Limiting & Pagination](#10-ordering-limiting--pagination)
11. [Aggregations & Group By](#11-aggregations--group-by)
12. [Joins](#12-joins)
13. [Relations (Relational Queries)](#13-relations-relational-queries)
14. [Transactions](#14-transactions)
15. [Prepared Statements](#15-prepared-statements)
16. [Advanced Schema Features](#16-advanced-schema-features)
17. [Enums & Custom Types](#17-enums--custom-types)
18. [drizzle-kit CLI Reference](#18-drizzle-kit-cli-reference)
19. [Seed Script](#19-seed-script)
20. [Full Project Example](#20-full-project-example)

---

## 1. Project Setup

### Install dependencies
```bash
npm install drizzle-orm pg
npm install -D drizzle-kit typescript ts-node @types/pg dotenv
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### .env
```
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
```

### Folder structure
```
src/
  db.ts           ← DB connection
  schema.ts       ← Table definitions
  seed.ts         ← Seed data
  queries/        ← Query examples
drizzle.config.ts
.env
```

---

## 2. Database Connection

### src/db.ts
```ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

> Pass `{ schema }` to enable **relational queries** (Phase 5).

---

## 3. Schema Definition

### src/schema.ts

```ts
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
```

### Column Types Cheatsheet

| Type | Drizzle |
|------|---------|
| Auto-increment PK | `serial('id').primaryKey()` |
| String (fixed length) | `varchar('name', { length: 100 })` |
| Unlimited text | `text('bio')` |
| Integer | `integer('age')` |
| Float | `real('score')` or `doublePrecision('score')` |
| Boolean | `boolean('active')` |
| Date/Time | `timestamp('created_at')` |
| Date only | `date('dob')` |
| JSON | `json('meta')` or `jsonb('meta')` |
| UUID | `uuid('id').defaultRandom().primaryKey()` |
| Numeric/Decimal | `numeric('price', { precision: 10, scale: 2 })` |

---

## 4. Migrations with drizzle-kit

### drizzle.config.ts
```ts
import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema:    './src/schema.ts',
  out:       './drizzle',
  dialect:   'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### CLI Commands
```bash
# Generate SQL migration files from schema
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit migrate

# Push schema directly to DB (dev only, no migration files)
npx drizzle-kit push

# Open Drizzle Studio (visual DB browser)
npx drizzle-kit studio

# Inspect existing DB and generate schema
npx drizzle-kit introspect
```

---

## 5. Insert Queries

```ts
import { db } from './db';
import { users, posts } from './schema';

// ── Insert a single row ────────────────────────────
const [newUser] = await db
  .insert(users)
  .values({
    name:  'Alice',
    email: 'alice@example.com',
    role:  'user',
  })
  .returning(); // returns inserted row(s)

console.log(newUser.id); // auto-generated id

// ── Insert multiple rows ───────────────────────────
await db.insert(users).values([
  { name: 'Bob',   email: 'bob@example.com' },
  { name: 'Carol', email: 'carol@example.com' },
]);

// ── Insert and ignore conflicts (ON CONFLICT DO NOTHING) ──
await db
  .insert(users)
  .values({ name: 'Alice', email: 'alice@example.com' })
  .onConflictDoNothing();

// ── Upsert (ON CONFLICT DO UPDATE) ────────────────
await db
  .insert(users)
  .values({ name: 'Alice', email: 'alice@example.com', role: 'admin' })
  .onConflictDoUpdate({
    target: users.email,          // conflict column
    set:    { name: 'Alice Updated' }, // what to update
  });
```

---

## 6. Select Queries

```ts
import { db } from './db';
import { users, posts } from './schema';
import { eq, sql } from 'drizzle-orm';

// ── Select all rows ────────────────────────────────
const allUsers = await db.select().from(users);

// ── Select specific columns ────────────────────────
const names = await db
  .select({ id: users.id, name: users.name })
  .from(users);

// ── Select with WHERE ──────────────────────────────
const active = await db
  .select()
  .from(users)
  .where(eq(users.isActive, true));

// ── Select one row ─────────────────────────────────
const [user] = await db
  .select()
  .from(users)
  .where(eq(users.id, 1))
  .limit(1);

// ── Select with alias ─────────────────────────────
const result = await db
  .select({
    userId:   users.id,
    fullName: users.name,
    email:    users.email,
  })
  .from(users);

// ── Select with raw SQL expression ────────────────
const result2 = await db
  .select({
    id:         users.id,
    upperName:  sql<string>`upper(${users.name})`,
  })
  .from(users);

// ── Select distinct ────────────────────────────────
const distinct = await db
  .selectDistinct({ role: users.role })
  .from(users);
```

---

## 7. Update Queries

```ts
import { db } from './db';
import { users } from './schema';
import { eq, lt } from 'drizzle-orm';

// ── Update a single row by id ──────────────────────
await db
  .update(users)
  .set({ name: 'Alice Smith' })
  .where(eq(users.id, 1));

// ── Update multiple columns ────────────────────────
await db
  .update(users)
  .set({
    name:      'New Name',
    isActive:  false,
    updatedAt: new Date(),
  })
  .where(eq(users.email, 'alice@example.com'));

// ── Update and return updated row ─────────────────
const [updated] = await db
  .update(users)
  .set({ role: 'admin' })
  .where(eq(users.id, 1))
  .returning();

// ── Bulk update with condition ─────────────────────
await db
  .update(users)
  .set({ isActive: false })
  .where(lt(users.createdAt, new Date('2024-01-01')));
```

---

## 8. Delete Queries

```ts
import { db } from './db';
import { users, posts } from './schema';
import { eq, inArray } from 'drizzle-orm';

// ── Delete a single row ────────────────────────────
await db
  .delete(users)
  .where(eq(users.id, 1));

// ── Delete with returning ──────────────────────────
const [deleted] = await db
  .delete(users)
  .where(eq(users.id, 1))
  .returning();

// ── Delete multiple rows ───────────────────────────
await db
  .delete(users)
  .where(inArray(users.id, [1, 2, 3]));

// ── Delete all rows in a table ─────────────────────
await db.delete(users);
```

---

## 9. Filtering & Operators

```ts
import {
  eq, ne, lt, lte, gt, gte,
  like, ilike, notLike,
  isNull, isNotNull,
  inArray, notInArray,
  between, notBetween,
  and, or, not,
  sql,
} from 'drizzle-orm';
import { db } from './db';
import { users, posts } from './schema';

// ── Equality / Inequality ───────────────────────────
db.select().from(users).where(eq(users.role, 'admin'));
db.select().from(users).where(ne(users.role, 'guest'));

// ── Comparison ─────────────────────────────────────
db.select().from(users).where(gt(users.id, 10));
db.select().from(users).where(gte(users.id, 10));
db.select().from(users).where(lt(users.id, 100));
db.select().from(users).where(lte(users.id, 100));

// ── LIKE / ILIKE (case-insensitive) ────────────────
db.select().from(users).where(like(users.name, 'Al%'));     // case sensitive
db.select().from(users).where(ilike(users.name, 'al%'));    // case insensitive
db.select().from(users).where(notLike(users.name, 'Al%'));

// ── NULL checks ────────────────────────────────────
db.select().from(users).where(isNull(users.updatedAt));
db.select().from(users).where(isNotNull(users.updatedAt));

// ── IN / NOT IN ────────────────────────────────────
db.select().from(users).where(inArray(users.role, ['admin', 'user']));
db.select().from(users).where(notInArray(users.id, [1, 2, 3]));

// ── BETWEEN ────────────────────────────────────────
db.select().from(users).where(between(users.id, 10, 50));
db.select().from(users).where(notBetween(users.id, 10, 50));

// ── AND / OR / NOT ─────────────────────────────────
db.select().from(users).where(
  and(
    eq(users.isActive, true),
    eq(users.role, 'admin')
  )
);

db.select().from(users).where(
  or(
    eq(users.role, 'admin'),
    eq(users.role, 'user')
  )
);

db.select().from(users).where(
  not(eq(users.isActive, false))
);

// ── Compound conditions ────────────────────────────
db.select().from(users).where(
  and(
    eq(users.isActive, true),
    or(
      eq(users.role, 'admin'),
      gt(users.id, 100)
    )
  )
);

// ── Raw SQL in WHERE ───────────────────────────────
db.select().from(users).where(
  sql`${users.name} ilike ${'%alice%'}`
);
```

---

## 10. Ordering, Limiting & Pagination

```ts
import { asc, desc } from 'drizzle-orm';
import { db } from './db';
import { users, posts } from './schema';

// ── Order ascending ────────────────────────────────
const byName = await db
  .select()
  .from(users)
  .orderBy(asc(users.name));

// ── Order descending ───────────────────────────────
const byNewest = await db
  .select()
  .from(posts)
  .orderBy(desc(posts.createdAt));

// ── Multiple order columns ─────────────────────────
const sorted = await db
  .select()
  .from(users)
  .orderBy(asc(users.role), desc(users.createdAt));

// ── Limit ──────────────────────────────────────────
const top5 = await db.select().from(users).limit(5);

// ── Offset-based pagination ────────────────────────
const page     = 2;
const pageSize = 10;
const paginated = await db
  .select()
  .from(users)
  .orderBy(asc(users.id))
  .limit(pageSize)
  .offset((page - 1) * pageSize);

// ── Count total for pagination ─────────────────────
import { sql } from 'drizzle-orm';

const [{ count }] = await db
  .select({ count: sql<number>`count(*)::int` })
  .from(users);
```

---

## 11. Aggregations & Group By

```ts
import { sql, eq } from 'drizzle-orm';
import { count, sum, avg, min, max } from 'drizzle-orm';
import { db } from './db';
import { users, posts } from './schema';

// ── Count all rows ─────────────────────────────────
const [{ total }] = await db
  .select({ total: count() })
  .from(users);

// ── Count with condition ───────────────────────────
const [{ activeCount }] = await db
  .select({ activeCount: count() })
  .from(users)
  .where(eq(users.isActive, true));

// ── Sum ────────────────────────────────────────────
// (example: sum of a numeric column)
const [{ totalScore }] = await db
  .select({ totalScore: sum(posts.id) })  // replace with a numeric col
  .from(posts);

// ── Avg / Min / Max ────────────────────────────────
const stats = await db
  .select({
    avgId: avg(users.id),
    minId: min(users.id),
    maxId: max(users.id),
  })
  .from(users);

// ── Group By ───────────────────────────────────────
const postsByAuthor = await db
  .select({
    authorId:  posts.authorId,
    postCount: count(),
  })
  .from(posts)
  .groupBy(posts.authorId);

// ── Group By + Having ──────────────────────────────
const prolificAuthors = await db
  .select({
    authorId:  posts.authorId,
    postCount: count(),
  })
  .from(posts)
  .groupBy(posts.authorId)
  .having(sql`count(*) > 5`);
```

---

## 12. Joins

```ts
import { eq } from 'drizzle-orm';
import { db } from './db';
import { users, posts, comments } from './schema';

// ── INNER JOIN ─────────────────────────────────────
const postsWithAuthors = await db
  .select({
    postId:    posts.id,
    title:     posts.title,
    authorName: users.name,
  })
  .from(posts)
  .innerJoin(users, eq(posts.authorId, users.id));

// ── LEFT JOIN (includes posts without matching users) ─
const postsLeftJoined = await db
  .select({
    postId:    posts.id,
    title:     posts.title,
    authorName: users.name,  // may be null
  })
  .from(posts)
  .leftJoin(users, eq(posts.authorId, users.id));

// ── RIGHT JOIN ─────────────────────────────────────
const usersRightJoined = await db
  .select()
  .from(posts)
  .rightJoin(users, eq(posts.authorId, users.id));

// ── FULL JOIN ──────────────────────────────────────
const fullJoined = await db
  .select()
  .from(posts)
  .fullJoin(users, eq(posts.authorId, users.id));

// ── Multiple joins ─────────────────────────────────
const detailed = await db
  .select({
    comment:    comments.content,
    postTitle:  posts.title,
    authorName: users.name,
  })
  .from(comments)
  .innerJoin(posts, eq(comments.postId, posts.id))
  .innerJoin(users, eq(comments.authorId, users.id));

// ── Self-join (alias) ──────────────────────────────
import { alias } from 'drizzle-orm/pg-core';

const managers  = alias(users, 'managers');
// (assumes users table has a managerId column)
// .innerJoin(managers, eq(users.managerId, managers.id))
```

---

## 13. Relations (Relational Queries)

Relations allow you to fetch nested data without writing explicit joins.

### Define relations in schema.ts

```ts
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many }) => ({
  posts:    many(posts),
  comments: many(comments),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author:   one(users,    { fields: [posts.authorId],   references: [users.id] }),
  comments: many(comments),
  postTags: many(postTags),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post:   one(posts, { fields: [comments.postId],   references: [posts.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, { fields: [postTags.postId], references: [posts.id] }),
  tag:  one(tags,  { fields: [postTags.tagId],  references: [tags.id] }),
}));
```

### Relational Queries

```ts
import { db } from './db';

// ── findMany ───────────────────────────────────────
const allPosts = await db.query.posts.findMany();

// ── findFirst ──────────────────────────────────────
const firstPost = await db.query.posts.findFirst();

// ── with (eager load relations) ────────────────────
const postsWithAuthor = await db.query.posts.findMany({
  with: {
    author: true,
  },
});

// ── Nested with ────────────────────────────────────
const postsDeep = await db.query.posts.findMany({
  with: {
    author:   true,
    comments: {
      with: { author: true },
    },
  },
});

// ── Select specific columns + with ────────────────
const partialPosts = await db.query.posts.findMany({
  columns: {
    id:    true,
    title: true,
  },
  with: {
    author: {
      columns: { name: true, email: true },
    },
  },
});

// ── where inside relational query ─────────────────
import { eq } from 'drizzle-orm';

const publishedPosts = await db.query.posts.findMany({
  where: (posts, { eq }) => eq(posts.published, true),
  with:  { author: true },
  orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  limit: 10,
});

// ── findFirst with where ───────────────────────────
const userWithPosts = await db.query.users.findFirst({
  where: (users, { eq }) => eq(users.id, 1),
  with: {
    posts: {
      where: (posts, { eq }) => eq(posts.published, true),
    },
  },
});
```

---

## 14. Transactions

```ts
import { db } from './db';
import { users, posts } from './schema';

// ── Basic transaction ──────────────────────────────
await db.transaction(async (tx) => {
  const [newUser] = await tx
    .insert(users)
    .values({ name: 'Dave', email: 'dave@example.com' })
    .returning();

  await tx.insert(posts).values({
    title:    'Hello World',
    body:     'First post!',
    authorId: newUser.id,
  });
});

// ── Rollback on error ──────────────────────────────
try {
  await db.transaction(async (tx) => {
    await tx.update(users).set({ name: 'Updated' }).where(eq(users.id, 1));

    // Throw to force rollback
    throw new Error('Something went wrong');
  });
} catch (err) {
  console.error('Transaction rolled back:', err);
}

// ── Manual rollback using tx.rollback() ────────────
await db.transaction(async (tx) => {
  await tx.insert(users).values({ name: 'Eve', email: 'eve@example.com' });

  const shouldAbort = true;
  if (shouldAbort) {
    tx.rollback(); // rollback and exit transaction
  }
});

// ── Nested transactions (savepoints) ──────────────
await db.transaction(async (tx) => {
  await tx.insert(users).values({ name: 'Frank', email: 'frank@example.com' });

  await tx.transaction(async (savepointTx) => {
    await savepointTx.insert(posts).values({ title: 'Nested', authorId: 1 });
    // rolling back here only rolls back the savepoint, not the outer tx
  });
});
```

---

## 15. Prepared Statements

Prepared statements are compiled once and reused — great for hot paths.

```ts
import { db } from './db';
import { users, posts } from './schema';
import { eq, sql } from 'drizzle-orm';
import { placeholder } from 'drizzle-orm';

// ── Prepare a select ───────────────────────────────
const getUserById = db
  .select()
  .from(users)
  .where(eq(users.id, placeholder('id')))
  .prepare('get_user_by_id');

// Execute
const [user] = await getUserById.execute({ id: 1 });

// ── Prepare an insert ──────────────────────────────
const createUser = db
  .insert(users)
  .values({
    name:  placeholder('name'),
    email: placeholder('email'),
  })
  .returning()
  .prepare('create_user');

const [newUser] = await createUser.execute({
  name:  'Grace',
  email: 'grace@example.com',
});

// ── Prepare an update ──────────────────────────────
const deactivateUser = db
  .update(users)
  .set({ isActive: false })
  .where(eq(users.id, placeholder('id')))
  .prepare('deactivate_user');

await deactivateUser.execute({ id: 5 });
```

---

## 16. Advanced Schema Features

```ts
import {
  pgTable, serial, text, integer, timestamp,
  boolean, uniqueIndex, index, check,
  primaryKey, foreignKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ── Composite Primary Key ──────────────────────────
export const postTagsWithPK = pgTable(
  'post_tags',
  {
    postId: integer('post_id').notNull(),
    tagId:  integer('tag_id').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.tagId] }),
  ]
);

// ── Indexes ────────────────────────────────────────
export const usersWithIndex = pgTable(
  'users_indexed',
  {
    id:    serial('id').primaryKey(),
    email: text('email').notNull(),
    name:  text('name').notNull(),
    role:  text('role').notNull(),
  },
  (t) => [
    uniqueIndex('email_idx').on(t.email),
    index('name_idx').on(t.name),
    index('role_name_idx').on(t.role, t.name), // composite index
  ]
);

// ── Check Constraints ──────────────────────────────
export const products = pgTable(
  'products',
  {
    id:    serial('id').primaryKey(),
    name:  text('name').notNull(),
    price: integer('price').notNull(),
  },
  (t) => [
    check('price_positive', sql`${t.price} > 0`),
  ]
);

// ── Default values ─────────────────────────────────
export const events = pgTable('events', {
  id:        serial('id').primaryKey(),
  name:      text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').$onUpdateFn(() => new Date()),
  status:    text('status').default('pending'),
  meta:      text('meta').$default(() => JSON.stringify({})),
});

// ── Generated columns (raw SQL default) ───────────
export const logs = pgTable('logs', {
  id:        serial('id').primaryKey(),
  message:   text('message').notNull(),
  createdAt: timestamp('created_at').default(sql`now()`),
});
```

---

## 17. Enums & Custom Types

```ts
import { pgEnum, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { customType } from 'drizzle-orm/pg-core';

// ── pgEnum ─────────────────────────────────────────
export const statusEnum = pgEnum('status', ['active', 'inactive', 'banned']);

export const accounts = pgTable('accounts', {
  id:     serial('id').primaryKey(),
  email:  text('email').notNull(),
  status: statusEnum('status').default('active').notNull(),
});

// ── Custom type (bytea example) ────────────────────
const bytea = customType<{ data: Buffer; driverData: string }>({
  dataType() {
    return 'bytea';
  },
  fromDriver(value: string): Buffer {
    return Buffer.from(value, 'hex');
  },
  toDriver(value: Buffer): string {
    return value.toString('hex');
  },
});

export const files = pgTable('files', {
  id:      serial('id').primaryKey(),
  name:    text('name').notNull(),
  content: bytea('content'),
});
```

---

## 18. drizzle-kit CLI Reference

```bash
# Generate migration files from schema changes
npx drizzle-kit generate

# Run pending migrations
npx drizzle-kit migrate

# Directly sync schema to DB (dev only — no migration history)
npx drizzle-kit push

# Drop all tables and reapply (DESTRUCTIVE)
npx drizzle-kit drop

# Open Drizzle Studio in browser
npx drizzle-kit studio

# Introspect existing DB → generate schema file
npx drizzle-kit introspect

# Check current migration status
npx drizzle-kit status
```

---

## 19. Seed Script

### src/seed.ts
```ts
import { db } from './db';
import { users, posts, comments, tags, postTags } from './schema';

async function seed() {
  console.log('Seeding...');

  // Users
  const insertedUsers = await db
    .insert(users)
    .values([
      { name: 'Alice',   email: 'alice@example.com',   role: 'admin' },
      { name: 'Bob',     email: 'bob@example.com',     role: 'user' },
      { name: 'Charlie', email: 'charlie@example.com', role: 'user' },
    ])
    .returning();

  // Posts
  const insertedPosts = await db
    .insert(posts)
    .values([
      { title: 'Getting Started with Drizzle', body: '...', authorId: insertedUsers[0].id, published: true },
      { title: 'Advanced Drizzle ORM',         body: '...', authorId: insertedUsers[0].id, published: true },
      { title: 'Draft Post',                   body: '...', authorId: insertedUsers[1].id, published: false },
    ])
    .returning();

  // Comments
  await db.insert(comments).values([
    { content: 'Great post!', postId: insertedPosts[0].id, authorId: insertedUsers[1].id },
    { content: 'Very helpful', postId: insertedPosts[0].id, authorId: insertedUsers[2].id },
  ]);

  // Tags
  const insertedTags = await db
    .insert(tags)
    .values([{ name: 'drizzle' }, { name: 'orm' }, { name: 'postgres' }])
    .returning();

  // Post-Tags
  await db.insert(postTags).values([
    { postId: insertedPosts[0].id, tagId: insertedTags[0].id },
    { postId: insertedPosts[0].id, tagId: insertedTags[2].id },
    { postId: insertedPosts[1].id, tagId: insertedTags[1].id },
  ]);

  console.log('Seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Run it:
```bash
npx ts-node src/seed.ts
```

---

## 20. Full Project Example

### src/queries/users.ts
```ts
import { db } from '../db';
import { users } from '../schema';
import { eq, ilike, and, desc, count } from 'drizzle-orm';

export async function createUser(name: string, email: string) {
  const [user] = await db
    .insert(users)
    .values({ name, email })
    .returning();
  return user;
}

export async function getUserById(id: number) {
  return db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, id),
    with: { posts: true },
  });
}

export async function searchUsers(query: string) {
  return db
    .select()
    .from(users)
    .where(ilike(users.name, `%${query}%`))
    .orderBy(desc(users.createdAt));
}

export async function deactivateUser(id: number) {
  const [updated] = await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return updated;
}

export async function deleteUser(id: number) {
  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();
  return deleted;
}

export async function getUserStats() {
  const [stats] = await db
    .select({
      total:  count(),
      admins: count(eq(users.role, 'admin')),
    })
    .from(users);
  return stats;
}
```

### src/queries/posts.ts
```ts
import { db } from '../db';
import { posts, users } from '../schema';
import { eq, desc, and } from 'drizzle-orm';

export async function getPublishedPosts(page = 1, limit = 10) {
  return db.query.posts.findMany({
    where:   (p, { eq }) => eq(p.published, true),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
    limit,
    offset:  (page - 1) * limit,
    with: {
      author:   { columns: { name: true, email: true } },
      comments: { with: { author: { columns: { name: true } } } },
    },
  });
}

export async function createPost(
  title: string,
  body: string,
  authorId: number
) {
  const [post] = await db
    .insert(posts)
    .values({ title, body, authorId })
    .returning();
  return post;
}

export async function publishPost(id: number) {
  const [post] = await db
    .update(posts)
    .set({ published: true })
    .where(eq(posts.id, id))
    .returning();
  return post;
}
```

---

## Quick Reference Card

| Operation | Code Pattern |
|-----------|-------------|
| Insert one | `db.insert(t).values({}).returning()` |
| Insert many | `db.insert(t).values([{}, {}])` |
| Upsert | `.onConflictDoUpdate({ target, set })` |
| Select all | `db.select().from(t)` |
| Select cols | `db.select({ a: t.a }).from(t)` |
| Find first | `db.query.t.findFirst({ where, with })` |
| Update | `db.update(t).set({}).where()` |
| Delete | `db.delete(t).where()` |
| Inner join | `.innerJoin(t2, eq(t.fk, t2.id))` |
| Left join | `.leftJoin(t2, eq(t.fk, t2.id))` |
| Relations | `db.query.t.findMany({ with: { rel: true } })` |
| Transaction | `db.transaction(async (tx) => { ... })` |
| Prepared | `db.select()...prepare('name')` → `.execute({})` |
| Count | `db.select({ c: count() }).from(t)` |
| Group by | `.groupBy(t.col)` |
| Order | `.orderBy(asc(t.col))` / `.orderBy(desc(t.col))` |
| Paginate | `.limit(n).offset((page-1)*n)` |
| Raw SQL | `sql\`...\`` |

---

*Last updated: March 2026*
