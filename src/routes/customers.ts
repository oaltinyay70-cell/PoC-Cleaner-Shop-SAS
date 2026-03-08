import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const customersRouter = Router();

customersRouter.use(authenticate as any);

const createCustomerSchema = z.object({
    name: z.string().min(1),
    phone: z.string().min(5),
    email: z.string().email().optional(),
    address: z.string().optional(),
    ratePerUnit: z.number().positive().optional(),
    notes: z.string().optional(),
    preferredChannel: z.enum(['WHATSAPP', 'VIBER', 'SMS', 'NONE']).optional(),
});

// GET /api/customers (FR-024, FR-025)
customersRouter.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { search, channel, page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: any = { businessId: req.user!.userId, isDeleted: false };
        if (search) {
            // SQLite: contains is case-insensitive by default for ASCII
            // PostgreSQL: add mode: 'insensitive' when switching back
            where.OR = [
                { name: { contains: search as string } },
                { phone: { contains: search as string } },
            ];
        }
        if (channel) where.preferredChannel = channel;

        const [customers, total] = await Promise.all([
            prisma.customer.findMany({ where, skip, take: parseInt(limit as string), orderBy: { name: 'asc' } }),
            prisma.customer.count({ where }),
        ]);

        res.json({ customers, total, page: parseInt(page as string), limit: parseInt(limit as string) });
    } catch (err) {
        console.error('[CUSTOMERS] List error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/customers (FR-020, FR-021)
customersRouter.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const body = createCustomerSchema.parse(req.body);
        const customer = await prisma.customer.create({
            data: { ...body, businessId: req.user!.userId, ratePerUnit: body.ratePerUnit ?? null },
        });
        res.status(201).json(customer);
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: err.errors });
            return;
        }
        console.error('[CUSTOMERS] Create error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// BUG-001 FIX: /followup and /top MUST be before /:id (Express matches in order)

// GET /api/customers/followup (FR-071)
customersRouter.get('/followup', async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - (user?.followupDays || 30));

        const customers = await prisma.customer.findMany({
            where: { businessId: req.user!.userId, isDeleted: false },
            include: { jobs: { orderBy: { createdAt: 'desc' }, take: 1 } },
        });

        const dueForFollowup = customers.filter(c => {
            if (c.jobs.length === 0) return true;
            return c.jobs[0].createdAt < threshold;
        });

        res.json({ customers: dueForFollowup, threshold: threshold.toISOString() });
    } catch (err) {
        console.error('[CUSTOMERS] Followup error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/customers/top (FR-072)
customersRouter.get('/top', async (req: AuthRequest, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string || '10');
        const customers = await prisma.customer.findMany({
            where: { businessId: req.user!.userId, isDeleted: false },
            include: { jobs: true },
        });

        const ranked = customers
            .map(c => ({
                id: c.id, name: c.name, phone: c.phone,
                totalRevenue: c.jobs.reduce((sum, j) => sum + Number(j.totalPrice), 0),
                totalJobs: c.jobs.length,
            }))
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, limit);

        res.json({ customers: ranked });
    } catch (err) {
        console.error('[CUSTOMERS] Top error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/customers/:id (FR-070 — includes CRM stats)
customersRouter.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const customer = await prisma.customer.findFirst({
            where: { id: req.params.id, businessId: req.user!.userId, isDeleted: false },
            include: { jobs: { orderBy: { createdAt: 'desc' }, take: 10 } },
        });
        if (!customer) {
            res.status(404).json({ error: 'Customer not found' });
            return;
        }

        // CRM stats
        const allJobs = await prisma.job.findMany({ where: { customerId: customer.id } });
        const lastVisit = allJobs.length > 0 ? allJobs[0].createdAt : null;
        const totalRevenue = allJobs.reduce((sum, j) => sum + Number(j.totalPrice), 0);
        const avgOrderValue = allJobs.length > 0 ? totalRevenue / allJobs.length : 0;

        res.json({
            ...customer,
            stats: { lastVisit, totalJobs: allJobs.length, totalRevenue, avgOrderValue },
        });
    } catch (err) {
        console.error('[CUSTOMERS] Detail error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/customers/:id (FR-022)
customersRouter.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const customer = await prisma.customer.updateMany({
            where: { id: req.params.id, businessId: req.user!.userId },
            data: req.body,
        });
        if (customer.count === 0) {
            res.status(404).json({ error: 'Customer not found' });
            return;
        }
        res.json({ message: 'Customer updated' });
    } catch (err) {
        console.error('[CUSTOMERS] Update error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/customers/:id (FR-023 — soft delete)
customersRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        await prisma.customer.updateMany({
            where: { id: req.params.id, businessId: req.user!.userId },
            data: { isDeleted: true },
        });
        res.json({ message: 'Customer deleted' });
    } catch (err) {
        console.error('[CUSTOMERS] Delete error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

