import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const notificationsRouter = Router();

notificationsRouter.use(authenticate as any);

// POST /api/notifications/send (FR-044, FR-045)
notificationsRouter.post('/send', async (req: AuthRequest, res: Response) => {
    try {
        const { customerId, message, templateId } = req.body;
        if (!customerId || (!message && !templateId)) {
            res.status(400).json({ error: 'customerId and either message or templateId required' });
            return;
        }

        const customer = await prisma.customer.findFirst({
            where: { id: customerId, businessId: req.user!.userId, isDeleted: false },
        });
        if (!customer) {
            res.status(404).json({ error: 'Customer not found' });
            return;
        }
        if (customer.preferredChannel === 'NONE') {
            res.status(400).json({ error: 'Customer has no notification channel set' });
            return;
        }

        // Resolve message body
        let messageBody = message;
        if (templateId) {
            const template = await prisma.messageTemplate.findFirst({
                where: { id: templateId, businessId: req.user!.userId },
            });
            if (!template) {
                res.status(404).json({ error: 'Template not found' });
                return;
            }
            // FR-046: Variable substitution
            messageBody = template.body
                .replace(/\[customer_name\]/g, customer.name)
                .replace(/\[date\]/g, new Date().toLocaleDateString());
        }

        // TODO: Actually send via notification adapter
        // For now, just log it
        const log = await prisma.notificationLog.create({
            data: {
                businessId: req.user!.userId,
                customerId,
                channel: customer.preferredChannel,
                messageBody: messageBody || '',
                status: 'SENT', // Would be FAILED if adapter throws
            },
        });

        res.json({ message: 'Notification sent', logId: log.id });
    } catch (err) {
        console.error('[NOTIFICATIONS] Send error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/notifications/bulk (FR-073)
notificationsRouter.post('/bulk', async (req: AuthRequest, res: Response) => {
    try {
        const { message } = req.body;
        if (!message) {
            res.status(400).json({ error: 'Message required' });
            return;
        }

        // Get all follow-up customers
        const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - (user?.followupDays || 30));

        const customers = await prisma.customer.findMany({
            where: { businessId: req.user!.userId, isDeleted: false, preferredChannel: { not: 'NONE' } },
            include: { jobs: { orderBy: { createdAt: 'desc' }, take: 1 } },
        });

        const dueCustomers = customers.filter(c => {
            if (c.jobs.length === 0) return true;
            return c.jobs[0].createdAt < threshold;
        });

        let sent = 0;
        let failed = 0;

        for (const customer of dueCustomers) {
            try {
                const personalizedMessage = message
                    .replace(/\[customer_name\]/g, customer.name);

                // TODO: Send via adapter
                await prisma.notificationLog.create({
                    data: {
                        businessId: req.user!.userId,
                        customerId: customer.id,
                        channel: customer.preferredChannel,
                        messageBody: personalizedMessage,
                        status: 'SENT',
                    },
                });
                sent++;
            } catch (err) {
                failed++;
            }
        }

        res.json({ message: `Bulk send complete`, sent, failed, total: dueCustomers.length });
    } catch (err) {
        console.error('[NOTIFICATIONS] Bulk error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/templates (FR-046)
notificationsRouter.get('/templates', async (req: AuthRequest, res: Response) => {
    try {
        const templates = await prisma.messageTemplate.findMany({
            where: { businessId: req.user!.userId },
            orderBy: { name: 'asc' },
        });
        res.json({ templates });
    } catch (err) {
        console.error('[TEMPLATES] List error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/notifications/templates — create new template
notificationsRouter.post('/templates', async (req: AuthRequest, res: Response) => {
    try {
        const { name, body } = req.body;
        if (!name || !body) {
            res.status(400).json({ error: 'name and body are required' });
            return;
        }
        const template = await prisma.messageTemplate.create({
            data: { businessId: req.user!.userId, name, body },
        });
        res.status(201).json(template);
    } catch (err) {
        console.error('[TEMPLATES] Create error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/templates/:id (FR-047)
notificationsRouter.put('/templates/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { name, body } = req.body;
        const result = await prisma.messageTemplate.updateMany({
            where: { id: req.params.id, businessId: req.user!.userId },
            data: { ...(name && { name }), ...(body && { body }) },
        });
        if (result.count === 0) {
            res.status(404).json({ error: 'Template not found' });
            return;
        }
        res.json({ message: 'Template updated' });
    } catch (err) {
        console.error('[TEMPLATES] Update error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
