import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const expensesRouter = Router();

expensesRouter.use(authenticate as any);

const createExpenseSchema = z.object({
    amount: z.number().min(0.01),
    category: z.enum(['SUPPLIES', 'FUEL', 'RENT', 'UTILITIES', 'MARKETING', 'OTHER']),
    description: z.string().optional(),
    date: z.string().datetime(),
});

// GET /api/expenses (FR-052)
expensesRouter.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { month, year } = req.query;
        const m = parseInt(month as string || String(new Date().getMonth() + 1));
        const y = parseInt(year as string || String(new Date().getFullYear()));

        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 1);

        const expenses = await prisma.expense.findMany({
            where: {
                businessId: req.user!.userId,
                date: { gte: startDate, lt: endDate },
            },
            orderBy: { date: 'desc' },
        });

        const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        res.json({ expenses, total, month: m, year: y });
    } catch (err) {
        console.error('[EXPENSES] List error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/expenses (FR-050)
expensesRouter.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const body = createExpenseSchema.parse(req.body);
        const expense = await prisma.expense.create({
            data: { ...body, date: new Date(body.date), businessId: req.user!.userId },
        });
        res.status(201).json(expense);
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: err.errors });
            return;
        }
        console.error('[EXPENSES] Create error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/expenses/:id (FR-051)
expensesRouter.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const result = await prisma.expense.updateMany({
            where: { id: req.params.id, businessId: req.user!.userId },
            data: req.body,
        });
        if (result.count === 0) {
            res.status(404).json({ error: 'Expense not found' });
            return;
        }
        res.json({ message: 'Expense updated' });
    } catch (err) {
        console.error('[EXPENSES] Update error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/expenses/:id (FR-051)
expensesRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        await prisma.expense.deleteMany({
            where: { id: req.params.id, businessId: req.user!.userId },
        });
        res.json({ message: 'Expense deleted' });
    } catch (err) {
        console.error('[EXPENSES] Delete error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
