import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const reportsRouter = Router();

reportsRouter.use(authenticate as any);

// GET /api/reports/monthly (FR-060, FR-061, FR-062)
reportsRouter.get('/monthly', async (req: AuthRequest, res: Response) => {
    try {
        const m = parseInt(req.query.month as string || String(new Date().getMonth() + 1));
        const y = parseInt(req.query.year as string || String(new Date().getFullYear()));

        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 1);

        // Revenue: sum of completed + delivered jobs
        const jobs = await prisma.job.findMany({
            where: {
                businessId: req.user!.userId,
                status: { in: ['COMPLETED', 'DELIVERED'] },
                createdAt: { gte: start, lt: end },
            },
        });
        const revenue = jobs.reduce((sum, j) => sum + Number(j.totalPrice), 0);

        // Expenses
        const expenses = await prisma.expense.findMany({
            where: { businessId: req.user!.userId, date: { gte: start, lt: end } },
        });
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        res.json({
            month: m, year: y,
            revenue: Math.round(revenue * 100) / 100,
            expenses: Math.round(totalExpenses * 100) / 100,
            profit: Math.round((revenue - totalExpenses) * 100) / 100,
            jobCount: jobs.length,
        });
    } catch (err) {
        console.error('[REPORTS] Monthly error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/reports/revenue-by-customer (FR-063)
reportsRouter.get('/revenue-by-customer', async (req: AuthRequest, res: Response) => {
    try {
        const m = parseInt(req.query.month as string || String(new Date().getMonth() + 1));
        const y = parseInt(req.query.year as string || String(new Date().getFullYear()));
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 1);

        const jobs = await prisma.job.findMany({
            where: {
                businessId: req.user!.userId,
                status: { in: ['COMPLETED', 'DELIVERED'] },
                createdAt: { gte: start, lt: end },
            },
            include: { customer: { select: { id: true, name: true } } },
        });

        const byCustomer: Record<string, { name: string; revenue: number; jobs: number }> = {};
        for (const job of jobs) {
            const key = job.customerId;
            if (!byCustomer[key]) byCustomer[key] = { name: job.customer.name, revenue: 0, jobs: 0 };
            byCustomer[key].revenue += Number(job.totalPrice);
            byCustomer[key].jobs++;
        }

        const sorted = Object.entries(byCustomer)
            .map(([id, data]) => ({ customerId: id, ...data }))
            .sort((a, b) => b.revenue - a.revenue);

        res.json({ breakdown: sorted, month: m, year: y });
    } catch (err) {
        console.error('[REPORTS] Revenue by customer error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/reports/trend (FR-064, FR-065)
reportsRouter.get('/trend', async (req: AuthRequest, res: Response) => {
    try {
        const months = parseInt(req.query.months as string || '3');
        const now = new Date();
        const data = [];

        for (let i = months - 1; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

            const jobs = await prisma.job.findMany({
                where: {
                    businessId: req.user!.userId,
                    status: { in: ['COMPLETED', 'DELIVERED'] },
                    createdAt: { gte: start, lt: end },
                },
            });

            const revenue = jobs.reduce((sum, j) => sum + Number(j.totalPrice), 0);
            data.push({
                month: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
                revenue: Math.round(revenue * 100) / 100,
                jobCount: jobs.length,
            });
        }

        res.json({ trend: data, months });
    } catch (err) {
        console.error('[REPORTS] Trend error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
