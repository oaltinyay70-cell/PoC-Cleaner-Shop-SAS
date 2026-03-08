import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { authRouter } from './routes/auth';
import { businessRouter } from './routes/business';
import { customersRouter } from './routes/customers';
import { jobsRouter } from './routes/jobs';
import { expensesRouter } from './routes/expenses';
import { reportsRouter } from './routes/reports';
import { notificationsRouter } from './routes/notifications';

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting (NFR-007: 100 req/min per user)
app.use(rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
}));

// --- Health check (FR: GET /health) ---
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Routes ---
app.use('/api/auth', authRouter);
app.use('/api/business', businessRouter);
app.use('/api/customers', customersRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/notifications', notificationsRouter);

// --- Global error handler ---
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`, err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// --- Start (skip if imported for testing) ---
const isDirectRun = process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js');
if (isDirectRun) {
    app.listen(config.port, () => {
        console.log(`🚀 Service Platform API running on port ${config.port}`);
        console.log(`   Health: http://localhost:${config.port}/health`);
    });
}

export default app;
