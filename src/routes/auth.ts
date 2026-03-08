import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { config } from '../config';
import { authenticate, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const authRouter = Router();

// --- Validation schemas ---
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

/** Generate access + refresh token pair */
function generateTokens(userId: string, email: string) {
    const accessToken = jwt.sign({ userId, email }, config.jwt.secret, {
        expiresIn: config.jwt.accessExpiresIn,
    });
    const refreshToken = jwt.sign({ userId, email }, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn,
    });
    return { accessToken, refreshToken };
}

// POST /api/auth/register (FR-001, FR-002, FR-007)
authRouter.post('/register', async (req: Request, res: Response) => {
    try {
        const body = registerSchema.parse(req.body);

        const existing = await prisma.user.findUnique({ where: { email: body.email } });
        if (existing) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }

        const passwordHash = await bcrypt.hash(body.password, 12);
        const user = await prisma.user.create({
            data: { email: body.email, passwordHash },
        });

        // TODO: Send confirmation email (FR-002)

        res.status(201).json({
            message: 'Registration successful. Please verify your email.',
            userId: user.id,
        });
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: err.errors });
            return;
        }
        console.error('[AUTH] Register error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/login (FR-003, FR-004)
authRouter.post('/login', async (req: Request, res: Response) => {
    try {
        const body = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email: body.email } });
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        // FR-003: Prevent login until email confirmed
        // (Relaxed for MVP — uncomment when email service is ready)
        // if (!user.emailVerified) {
        //   res.status(403).json({ error: 'Please verify your email first' });
        //   return;
        // }

        const valid = await bcrypt.compare(body.password, user.passwordHash);
        if (!valid) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        const tokens = generateTokens(user.id, user.email);
        res.json({ ...tokens, userId: user.id });
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: err.errors });
            return;
        }
        console.error('[AUTH] Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/refresh (FR-004)
authRouter.post('/refresh', async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token required' });
            return;
        }

        const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string; email: string };
        const tokens = generateTokens(decoded.userId, decoded.email);
        res.json(tokens);
    } catch (err) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

// POST /api/auth/forgot-password (FR-005)
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email required' });
            return;
        }
        // Always return success to prevent email enumeration
        // TODO: Send reset email with time-limited token (1 hour)
        res.json({ message: 'If this email exists, a reset link has been sent.' });
    } catch (err) {
        console.error('[AUTH] Forgot password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/reset-password (FR-005)
authRouter.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            res.status(400).json({ error: 'Token and new password required' });
            return;
        }
        // TODO: Validate reset token and update password
        res.json({ message: 'Password has been reset successfully.' });
    } catch (err) {
        console.error('[AUTH] Reset password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
