import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

/** Decoded JWT payload shape */
export interface AuthPayload {
    userId: string;
    email: string;
}

/** Extended Request with authenticated user */
export interface AuthRequest extends Request {
    user?: AuthPayload;
}

/**
 * JWT authentication middleware.
 * Extracts and verifies Bearer token from Authorization header.
 * Attaches decoded user to req.user.
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authorization header required' });
        return;
    }

    const token = header.slice(7);
    try {
        const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}
