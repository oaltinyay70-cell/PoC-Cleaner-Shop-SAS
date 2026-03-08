# Service Business Platform — MVP

A SaaS platform for small single-operator service businesses (carpet cleaners, laundries, tailors, repair shops) to manage customers, jobs, notifications, expenses, and finance — all from one tool.

## Quick Start (Docker)

```bash
# 1. Clone and configure
cp src/.env.example .env
# Edit .env with your secrets

# 2. Start everything
docker-compose up -d

# 3. Run migrations
docker-compose run --rm migrate

# 4. Seed demo data
docker-compose exec api npx tsx prisma/seed.ts

# 5. Access
# API: http://localhost:3000
# Health: http://localhost:3000/health
```

**Demo credentials**: `demo@serviceplatform.com` / `demo1234`

## Quick Start (Local Development)

```bash
# Prerequisites: Node.js 20+, PostgreSQL 15+

cd src/
cp .env.example .env
# Edit .env: set DATABASE_URL to your PostgreSQL

npm install
npx prisma migrate dev --schema=prisma/schema.prisma
npx tsx prisma/seed.ts        # optional: load demo data
npm run dev                    # starts on port 3000
```

## Architecture

| Layer | Technology |
|---|---|
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 15 + Prisma ORM |
| Auth | JWT (access + refresh tokens) |
| File Storage | AWS S3 (presigned URLs) |
| Notifications | Pluggable adapters (WhatsApp/SMS/Viber) |
| Mobile | Flutter + Riverpod (Phase 2) |
| Deployment | Docker + Docker Compose |

## API Endpoints

| Group | Endpoints | Auth |
|---|---|---|
| Auth | POST register, login, refresh, forgot/reset password | No |
| Business | GET/PUT profile, PUT settings | Yes |
| Customers | GET list/detail/followup/top, POST, PUT, DELETE | Yes |
| Jobs | GET list/detail, POST, PUT status, POST photos | Yes |
| Expenses | GET list, POST, PUT, DELETE | Yes |
| Reports | GET monthly/revenue-by-customer/trend | Yes |
| Notifications | POST send/bulk, GET/PUT templates | Yes |
| System | GET /health | No |

**Total: 25 endpoints across 7 route groups**

## Testing

```bash
cd src/
npm test          # run all tests
npm run test:watch # watch mode
```

**53 unit tests** covering:
- Business logic (auto-pricing, status transitions, templates, follow-up)
- Encryption (AES-256-GCM round-trip)
- Validation (all schemas)
- Notification adapters (factory, all 3 channels)

## Project Structure

```
ServicePlatform/
├── docs/
│   ├── architecture/mvp-architecture.md
│   ├── specs/mvp-spec.md
│   ├── specs/mvp-assumptions.md
│   ├── specs/mvp-testspec.md
│   ├── qa/mvp-test-plan.md
│   ├── qa/bugs/BUG-001.md
│   └── reports/mvp-test-report.md
├── src/
│   ├── __tests__/          # Unit tests (53)
│   ├── middleware/auth.ts   # JWT middleware
│   ├── notifications/       # Channel adapters (WA/SMS/Viber)
│   ├── prisma/schema.prisma # Database schema
│   ├── prisma/seed.ts       # Demo data
│   ├── routes/              # 7 route modules
│   ├── utils/               # Encryption, validation
│   ├── config.ts            # Env config
│   └── index.ts             # Express app
├── Dockerfile               # Multi-stage build
├── docker-compose.yml       # Full stack
├── TEAM_CHAT.md             # Agent communication log
└── README.md                # This file
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| PORT | No | 3000 | API server port |
| DATABASE_URL | Yes | — | PostgreSQL connection string |
| JWT_SECRET | Yes | — | Access token signing key |
| JWT_REFRESH_SECRET | Yes | — | Refresh token signing key |
| ENCRYPTION_KEY | Yes | — | AES-256 key for API key encryption |
| AWS_S3_BUCKET | No | — | S3 bucket for photo uploads |
| AWS_REGION | No | eu-central-1 | AWS region |

## Sprint History

| Sprint | Focus | Status |
|---|---|---|
| 1 | BA specs + DEV backend + QA review | ✅ Complete |
| 2 | Utilities + tests + adapters | ✅ Complete (53/53 tests pass) |
| 3 | Docker + seed + README + mobile scaffold | ✅ Complete |

---

Built with the 3-agent system (BA/DEV/QA) — see `TEAM_CHAT.md` for the full interaction log.
