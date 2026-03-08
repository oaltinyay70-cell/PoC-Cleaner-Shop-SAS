FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY src/package*.json ./
RUN npm ci --production=false

# Copy source
COPY src/ .

# Generate Prisma client
RUN npx prisma generate --schema=prisma/schema.prisma

# Build TypeScript
RUN npm run build

# --- Production stage ---
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm ci --production

COPY --from=builder /app/dist/ ./dist/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma/ ./prisma/

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["node", "dist/index.js"]
