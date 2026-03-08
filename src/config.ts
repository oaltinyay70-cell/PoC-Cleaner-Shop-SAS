import dotenv from 'dotenv';
dotenv.config();

/** Application configuration from environment variables */
export const config = {
    port: parseInt(process.env.PORT || '3000', 10),

    database: {
        url: process.env.DATABASE_URL || '',
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'dev-secret',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
        accessExpiresIn: '24h',
        refreshExpiresIn: '30d',
    },

    encryption: {
        key: process.env.ENCRYPTION_KEY || '',
    },

    aws: {
        s3Bucket: process.env.AWS_S3_BUCKET || '',
        region: process.env.AWS_REGION || 'eu-central-1',
    },

    rateLimit: {
        windowMs: 60 * 1000, // 1 minute
        max: 100,            // 100 requests per minute (NFR-007)
    },
} as const;
