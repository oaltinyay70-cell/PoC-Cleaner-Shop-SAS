import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const businessRouter = Router();

// All business routes require auth
businessRouter.use(authenticate as any);

// GET /api/business/profile (FR-010, FR-011, FR-012)
businessRouter.get('/profile', async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: {
                id: true, email: true, businessName: true, serviceType: true,
                currency: true, defaultUnit: true, logoUrl: true,
                subscriptionTier: true, subscriptionRenewalDate: true,
                followupDays: true, createdAt: true,
            },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    } catch (err) {
        console.error('[BUSINESS] Profile error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/business/profile (FR-080)
businessRouter.put('/profile', async (req: AuthRequest, res: Response) => {
    try {
        const { businessName, serviceType, currency, defaultUnit, logoUrl, followupDays } = req.body;
        const user = await prisma.user.update({
            where: { id: req.user!.userId },
            data: {
                ...(businessName !== undefined && { businessName }),
                ...(serviceType !== undefined && { serviceType }),
                ...(currency !== undefined && { currency }),
                ...(defaultUnit !== undefined && { defaultUnit }),
                ...(logoUrl !== undefined && { logoUrl }),
                ...(followupDays !== undefined && { followupDays }),
            },
        });
        res.json({ message: 'Profile updated', businessName: user.businessName });
    } catch (err) {
        console.error('[BUSINESS] Update error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/business/settings (FR-013 — API keys)
businessRouter.put('/settings', async (req: AuthRequest, res: Response) => {
    try {
        const { whatsappApiKey, smsApiKey, viberApiKey } = req.body;
        // TODO: Encrypt API keys with AES-256-GCM before storing
        await prisma.user.update({
            where: { id: req.user!.userId },
            data: {
                ...(whatsappApiKey !== undefined && { whatsappApiKey }),
                ...(smsApiKey !== undefined && { smsApiKey }),
                ...(viberApiKey !== undefined && { viberApiKey }),
            },
        });
        res.json({ message: 'Settings updated' });
    } catch (err) {
        console.error('[BUSINESS] Settings error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
