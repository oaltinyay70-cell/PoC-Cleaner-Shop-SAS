# Architecture — Service Business Platform MVP

**Author**: DEV Agent  
**Date**: 2026-03-07  
**Spec**: docs/specs/mvp-spec.md

---

## 1. Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| Backend | **Node.js + Express + TypeScript** | Fast to build, excellent ecosystem, team familiarity |
| Database | **PostgreSQL 15** | ACID transactions, JSON support, full-text search (FR-024), robust |
| ORM | **Prisma** | Type-safe queries, auto-migrations, schema-first |
| Auth | **JWT** (access + refresh tokens) | FR-004 spec, stateless, mobile-friendly |
| File Storage | **AWS S3** | FR-036, presigned uploads, CDN-friendly |
| Notifications | **Pluggable adapters** (WhatsApp/Twilio/Viber) | FR-040–047, each channel = adapter |
| Scheduler | **node-cron** | FR-041, daily delivery reminders |
| Mobile | **Flutter (Dart)** | Project constraint |
| State Mgmt | **Riverpod** | Compile-safe, testable, modern |
| API Style | **REST** | Simpler than GraphQL for this scope, well-understood |

---

## 2. System Architecture

```
┌──────────────┐     HTTPS/REST      ┌──────────────────┐
│  Flutter App │ ◄──────────────────► │  Express API      │
│  (iOS + And) │                      │  (Node.js + TS)   │
└──────────────┘                      ├──────────────────┤
                                      │  Auth Middleware   │
┌──────────────┐     HTTPS/REST      │  Rate Limiter      │
│  Web Client  │ ◄──────────────────► │  Route Handlers    │
│  (Future)    │                      │  Service Layer     │
└──────────────┘                      │  Prisma ORM        │
                                      └────────┬───────────┘
                                               │
                              ┌────────────────┼────────────────┐
                              ▼                ▼                ▼
                      ┌──────────────┐ ┌──────────┐ ┌───────────────┐
                      │ PostgreSQL   │ │  AWS S3   │ │ Notification  │
                      │ Database     │ │ (Photos)  │ │ Adapters      │
                      └──────────────┘ └──────────┘ │ WA/SMS/Viber  │
                                                    └───────────────┘
```

---

## 3. Database Schema (Prisma)

```prisma
model User {
  id                      String   @id @default(uuid())
  email                   String   @unique
  passwordHash            String
  emailVerified           Boolean  @default(false)
  businessName            String?
  serviceType             String?
  currency                String   @default("EUR")
  defaultUnit             String   @default("pieces")
  logoUrl                 String?
  whatsappApiKey          String?  // Encrypted at rest
  smsApiKey               String?
  viberApiKey             String?
  subscriptionTier        String   @default("MVP")
  subscriptionRenewalDate DateTime?
  followupDays            Int      @default(30)
  createdAt               DateTime @default(now())
  customers               Customer[]
  jobs                    Job[]
  expenses                Expense[]
  templates               MessageTemplate[]
}

model Customer {
  id               String   @id @default(uuid())
  businessId       String
  business         User     @relation(fields: [businessId], references: [id])
  name             String
  phone            String
  email            String?
  address          String?
  ratePerUnit      Decimal? @db.Decimal(10,2)
  notes            String?
  preferredChannel Channel  @default(NONE)
  isDeleted        Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  jobs             Job[]
}

model Job {
  id                   String    @id @default(uuid())
  businessId           String
  business             User      @relation(fields: [businessId], references: [id])
  customerId           String
  customer             Customer  @relation(fields: [customerId], references: [id])
  quantity             Decimal   @db.Decimal(10,3)
  unit                 String
  rate                 Decimal   @db.Decimal(10,2)
  totalPrice           Decimal   @db.Decimal(10,2)
  status               JobStatus @default(RECEIVED)
  expectedDeliveryDate DateTime
  actualDeliveryDate   DateTime?
  notes                String?
  receivedAt           DateTime  @default(now())
  processingAt         DateTime?
  completedAt          DateTime?
  deliveredAt          DateTime?
  createdAt            DateTime  @default(now())
  photos               JobPhoto[]
  notifications        NotificationLog[]
}

model JobPhoto {
  id         String   @id @default(uuid())
  jobId      String
  job        Job      @relation(fields: [jobId], references: [id])
  url        String
  uploadedAt DateTime @default(now())
}

model Expense {
  id          String        @id @default(uuid())
  businessId  String
  business    User          @relation(fields: [businessId], references: [id])
  amount      Decimal       @db.Decimal(10,2)
  category    ExpenseCategory
  description String?
  date        DateTime
  createdAt   DateTime      @default(now())
}

model MessageTemplate {
  id         String  @id @default(uuid())
  businessId String
  business   User    @relation(fields: [businessId], references: [id])
  name       String
  body       String
  isSystem   Boolean @default(false)
}

model NotificationLog {
  id           String             @id @default(uuid())
  businessId   String
  customerId   String
  jobId        String?
  channel      Channel
  messageBody  String
  status       NotificationStatus
  errorMessage String?
  sentAt       DateTime           @default(now())
  job          Job?               @relation(fields: [jobId], references: [id])
}

enum Channel { WHATSAPP VIBER SMS NONE }
enum JobStatus { RECEIVED PROCESSING COMPLETED DELIVERED }
enum ExpenseCategory { SUPPLIES FUEL RENT UTILITIES MARKETING OTHER }
enum NotificationStatus { SENT FAILED }
```

---

## 4. API Design

### Auth
| Method | Path | Description | Auth |
|---|---|---|---|
| POST | /api/auth/register | Register | No |
| POST | /api/auth/login | Login → JWT | No |
| POST | /api/auth/refresh | Refresh token | Refresh |
| POST | /api/auth/forgot-password | Send reset email | No |
| POST | /api/auth/reset-password | Reset with token | No |
| GET  | /api/auth/verify-email/:token | Email confirm | No |

### Business
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /api/business/profile | Get profile | Yes |
| PUT | /api/business/profile | Update profile | Yes |
| PUT | /api/business/settings | Update settings | Yes |

### Customers
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /api/customers | List (search, filter, paginate) | Yes |
| POST | /api/customers | Create | Yes |
| GET | /api/customers/:id | Detail + CRM stats | Yes |
| PUT | /api/customers/:id | Update | Yes |
| DELETE | /api/customers/:id | Soft delete | Yes |
| GET | /api/customers/followup | Due for follow-up | Yes |
| GET | /api/customers/top | Top by revenue | Yes |

### Jobs
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /api/jobs | List (filter, paginate) | Yes |
| POST | /api/jobs | Create + auto-notify | Yes |
| GET | /api/jobs/:id | Detail | Yes |
| PUT | /api/jobs/:id/status | Advance status | Yes |
| POST | /api/jobs/:id/photos | Upload photo | Yes |

### Expenses
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /api/expenses | List by month | Yes |
| POST | /api/expenses | Create | Yes |
| PUT | /api/expenses/:id | Update | Yes |
| DELETE | /api/expenses/:id | Delete | Yes |

### Reports
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /api/reports/monthly | Revenue/expense/profit | Yes |
| GET | /api/reports/revenue-by-customer | Breakdown | Yes |
| GET | /api/reports/trend | Revenue trend chart data | Yes |

### Notifications
| Method | Path | Description | Auth |
|---|---|---|---|
| POST | /api/notifications/send | Manual message | Yes |
| POST | /api/notifications/bulk | Bulk follow-up | Yes |
| GET | /api/templates | List templates | Yes |
| PUT | /api/templates/:id | Update template | Yes |

### System
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /health | Health check | No |

---

## 5. Folder Structure

```
ServicePlatform/
├── src/
│   ├── index.ts              # Express app entry
│   ├── config.ts             # Environment config
│   ├── prisma/
│   │   └── schema.prisma
│   ├── middleware/
│   │   ├── auth.ts           # JWT verification
│   │   └── rateLimiter.ts    # 100 req/min
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── business.ts
│   │   ├── customers.ts
│   │   ├── jobs.ts
│   │   ├── expenses.ts
│   │   ├── reports.ts
│   │   └── notifications.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── customerService.ts
│   │   ├── jobService.ts
│   │   ├── expenseService.ts
│   │   ├── reportService.ts
│   │   └── notificationService.ts
│   ├── notifications/
│   │   ├── adapter.ts        # Base interface
│   │   ├── whatsapp.ts
│   │   ├── sms.ts
│   │   └── viber.ts
│   └── utils/
│       ├── encryption.ts     # API key encryption
│       └── validation.ts     # Input validators
├── mobile/                   # Flutter project
├── docs/
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 6. Key Decisions

- **Offline-first mobile**: SQLite local DB + sync queue. Changes queued offline, replayed on reconnect.
- **Photo uploads**: Client gets presigned S3 URL from backend, uploads directly to S3 (no backend proxy).
- **Notification adapters**: Strategy pattern — each channel implements `send(to, message)`. Failures logged, never crash job operations.
- **Rate limiting**: express-rate-limit at 100 req/min per user (by JWT sub claim).
- **Encryption**: API keys encrypted with AES-256-GCM using a server environment key.
