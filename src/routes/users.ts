import { Router, Request, Response } from 'express';
import { and, arrayContains, count, desc, eq, ilike, inArray } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../schema';
import { parseId } from './utils';

export const usersRouter = Router();

usersRouter.get('/', async (_req: Request, res: Response) => {
    const { page, size, roles,name,email } = _req.query;

    const pageSize = typeof size === 'string' ? parseInt(size) : 10;
    const pageNumber = typeof page === 'string' ? parseInt(page) : 1;
    const offset = (pageNumber - 1) * pageSize;
    const conditions = []

    if (roles) {

        const validRoles = ['admin', 'user', 'guest'];

        if (typeof roles !== 'string') {
            return res.status(400).json({ message: 'Invalid role filter' });
        }

        const roleArray = roles.split(',').map(role => role.trim()) as ('admin' | 'user' | 'guest')[];

        const invalidRole = roleArray.find(role => !validRoles.includes(role));

        if (invalidRole) {
            return res.status(400).json({ message: `Invalid role: ${invalidRole}` });
        }

        conditions.push(inArray(users.role, roleArray));

    }

    if(name){

        if(typeof name !== 'string'){

            return res.status(400).json({ message: 'Invalid name filter' });
        
        }

        conditions.push(ilike(users.name, `%${name}%`));
    }
    
    const result = await db.select()
        .from(users).
        where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(users.id))
        .limit(pageSize).offset(offset);

    const [{ total }] = await db
        .select({ total: count() })
        .from(users);


    res.json({ pageSize, page: pageNumber, totalUsers: total, data: result });

})

usersRouter.get('/:id', async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid id' });
    }

    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
});

usersRouter.post('/', async (req: Request, res: Response) => {
    const { name, email, role } = req.body as {
        name?: string;
        email?: string;
        role?: 'admin' | 'user' | 'guest';
    };

    if (!name || !email) {
        return res.status(400).json({ message: 'name and email are required' });
    }

    const [created] = await db
        .insert(users)
        .values({ name, email, role: role ?? 'user' })
        .returning();

    return res.status(201).json(created);
});

usersRouter.patch('/:id', async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid id' });
    }

    const payload = req.body as {
        name?: string;
        email?: string;
        role?: 'admin' | 'user' | 'guest';
        isActive?: boolean;
    };

    const [updated] = await db
        .update(users)
        .set({ ...payload, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

    if (!updated) {
        return res.status(404).json({ message: 'User not found' });
    }

    return res.json(updated);
});

usersRouter.delete('/:id', async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid id' });
    }

    const [deleted] = await db.delete(users).where(eq(users.id, id)).returning();
    if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
    }

    return res.json(deleted);
});
