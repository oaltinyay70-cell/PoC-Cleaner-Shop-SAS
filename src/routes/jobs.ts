import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const jobsRouter = Router();

jobsRouter.use(authenticate as any);

const createJobSchema = z.object({
    customerId: z.string().uuid(),
    quantity: z.number().positive(),
    expectedDeliveryDate: z.string().datetime(),
    notes: z.string().optional(),
});

// GET /api/jobs (FR-038, FR-039)
jobsRouter.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { status, customerId, dateFrom, dateTo, page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: any = { businessId: req.user!.userId };
        if (status) where.status = status;
        if (customerId) where.customerId = customerId;
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
            if (dateTo) where.createdAt.lte = new Date(dateTo as string);
        }

        const [jobs, total] = await Promise.all([
            prisma.job.findMany({
                where, skip, take: parseInt(limit as string),
                orderBy: { createdAt: 'desc' },
                include: { customer: { select: { name: true, phone: true } } },
            }),
            prisma.job.count({ where }),
        ]);

        res.json({ jobs, total, page: parseInt(page as string) });
    } catch (err) {
        console.error('[JOBS] List error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/jobs (FR-030, FR-031, FR-032, FR-037, FR-040)
jobsRouter.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const body = createJobSchema.parse(req.body);

        // Get customer rate and business unit
        const customer = await prisma.customer.findFirst({
            where: { id: body.customerId, businessId: req.user!.userId, isDeleted: false },
        });
        if (!customer) {
            res.status(404).json({ error: 'Customer not found' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
        const rate = Number(customer.ratePerUnit || 0);
        const quantity = body.quantity;
        // FR-031: price = floor(quantity * rate * 100) / 100
        const totalPrice = Math.floor(quantity * rate * 100) / 100;

        const job = await prisma.job.create({
            data: {
                businessId: req.user!.userId,
                customerId: body.customerId,
                quantity,
                unit: user?.defaultUnit || 'pieces',
                rate,
                totalPrice,
                expectedDeliveryDate: new Date(body.expectedDeliveryDate),
                notes: body.notes,
            },
        });

        // FR-040: Auto-notify customer on job received
        // TODO: Send notification via preferred channel

        res.status(201).json(job);
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: err.errors });
            return;
        }
        console.error('[JOBS] Create error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/jobs/:id
jobsRouter.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const job = await prisma.job.findFirst({
            where: { id: req.params.id, businessId: req.user!.userId },
            include: {
                customer: { select: { name: true, phone: true, preferredChannel: true } },
                photos: true,
                notifications: { orderBy: { sentAt: 'desc' } },
            },
        });
        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }
        res.json(job);
    } catch (err) {
        console.error('[JOBS] Detail error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/jobs/:id/status (FR-033, FR-034, FR-042)
jobsRouter.put('/:id/status', async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;
        const validTransitions: Record<string, string> = {
            RECEIVED: 'PROCESSING',
            PROCESSING: 'COMPLETED',
            COMPLETED: 'DELIVERED',
        };

        const job = await prisma.job.findFirst({
            where: { id: req.params.id, businessId: req.user!.userId },
        });
        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }

        // FR-033: No backwards transitions
        if (validTransitions[job.status] !== status) {
            res.status(400).json({
                error: `Cannot transition from ${job.status} to ${status}. Next valid: ${validTransitions[job.status] || 'none'}`,
            });
            return;
        }

        // FR-034: Record timestamp of transition
        const timestampField = `${status.toLowerCase()}At`;
        const updateData: any = { status, [timestampField]: new Date() };
        if (status === 'DELIVERED') {
            updateData.actualDeliveryDate = new Date();
        }

        const updated = await prisma.job.update({
            where: { id: req.params.id },
            data: updateData,
        });

        // FR-042: Auto-notify on delivery
        // TODO: Send "job delivered" notification with price

        res.json(updated);
    } catch (err) {
        console.error('[JOBS] Status update error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/jobs/:id/photos (FR-035, FR-036)
jobsRouter.post('/:id/photos', async (req: AuthRequest, res: Response) => {
    try {
        const job = await prisma.job.findFirst({
            where: { id: req.params.id, businessId: req.user!.userId },
            include: { photos: true },
        });
        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }

        // FR-035: Max 10 photos per job
        if (job.photos.length >= 10) {
            res.status(400).json({ error: 'Maximum 10 photos per job reached' });
            return;
        }

        // In production: generate presigned S3 URL
        // For now, accept a URL directly
        const { url } = req.body;
        if (!url) {
            res.status(400).json({ error: 'Photo URL required' });
            return;
        }

        const photo = await prisma.jobPhoto.create({
            data: { jobId: req.params.id, url },
        });

        res.status(201).json(photo);
    } catch (err) {
        console.error('[JOBS] Photo upload error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
