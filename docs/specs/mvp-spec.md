# Functional Specification — Service Business Platform MVP

**Prepared by**: BA Agent  
**Date**: 2026-03-07  
**Version**: 1.0  
**Status**: DRAFT → Pending DEV architecture acknowledgement  
**Source**: PRD_Service_Business_Platform.docx  
**Assumptions**: See `docs/specs/mvp-assumptions.md`

---

## 1. Feature Overview

The **Service Business Platform** is a SaaS application for small single-operator service businesses (laundries, carpet cleaners, tailors, repairs, couriers, etc.) to manage their day-to-day operations from a single tool accessible on web and mobile.

**Business Value**: Replaces paper notebooks and spreadsheets with a digital system that auto-calculates pricing, sends customer notifications automatically, tracks finances, and surfaces repeat customers — reducing admin overhead and increasing repeat revenue through proactive follow-ups.

---

## 2. User Stories

### Authentication & Onboarding

| ID | User Story |
|---|---|
| US-001 | As a **business owner**, I want to register with email and password so that I can create my business account. |
| US-002 | As a **business owner**, I want to confirm my email via a link so that my account is verified and secure. |
| US-003 | As a **business owner**, I want to log in from web and mobile so that I can access my data anywhere. |
| US-004 | As a **business owner**, I want to reset my password via email so that I can recover access to my account. |
| US-005 | As a **business owner**, I want to configure my business details (name, service type, currency, unit) so that the system reflects my business correctly. |
| US-006 | As a **business owner**, I want to configure which notification channels (WhatsApp/SMS/Viber) I use so the system sends messages through my preferred providers. |

### Customer Management

| ID | User Story |
|---|---|
| US-010 | As a **business owner**, I want to add a new customer with name, phone, email, address, rate, and notes so that I have a complete customer record. |
| US-011 | As a **business owner**, I want to edit a customer's details at any time so that I can keep information up to date. |
| US-012 | As a **business owner**, I want to delete a customer so that I can remove inactive records. |
| US-013 | As a **business owner**, I want to search and filter my customer list so that I can find a customer quickly. |
| US-014 | As a **business owner**, I want to assign a preferred notification channel per customer (WhatsApp/Viber/SMS) so that messages go through the right channel. |

### Job / Order Management

| ID | User Story |
|---|---|
| US-020 | As a **business owner**, I want to create a new job for a customer, entering quantity and expected delivery date, so that I can track service orders. |
| US-021 | As a **business owner**, I want the system to auto-calculate the job price (Quantity × Customer Rate) so that I don't have to do math manually. |
| US-022 | As a **business owner**, I want to update a job's status (Received → Processing → Completed → Delivered) so that I can track progress. |
| US-023 | As a **business owner**, I want to attach photos to a job so that I can document item condition before and after. |
| US-024 | As a **business owner**, I want to add notes to a job so that I can record special instructions. |
| US-025 | As a **business owner**, I want to view all jobs with their current status so that I have a full operational overview. |
| US-026 | As a **business owner**, I want to filter jobs by status, date range, or customer so that I can find specific orders. |
| US-027 | As a **business owner**, I want to create a new customer directly from the new job flow so that I don't have to switch screens. |

### Notifications

| ID | User Story |
|---|---|
| US-030 | As a **business owner**, I want the system to automatically notify the customer when a job is created (received) so that they know their order is logged. |
| US-031 | As a **business owner**, I want the system to automatically send a reminder notification 1 day before the expected delivery date so that the customer is prepared. |
| US-032 | As a **business owner**, I want the system to automatically notify the customer when a job is marked Delivered, including the total price, so that they know it's ready and what to pay. |
| US-033 | As a **business owner**, I want to manually send a custom message to any customer via my chosen channel so that I can communicate outside of the automated flow. |
| US-034 | As a **business owner**, I want to select from pre-defined message templates when sending a manual message so that I save time writing. |
| US-035 | As a **business owner**, I want to customize message templates in settings so that the messages match my business voice. |

### Expense Tracking

| ID | User Story |
|---|---|
| US-040 | As a **business owner**, I want to log a business expense (amount, category, description, date) so that I can track my costs. |
| US-041 | As a **business owner**, I want to edit or delete logged expenses so that I can correct mistakes. |
| US-042 | As a **business owner**, I want to view all expenses for a selected month so that I can review my spending. |

### Financial Reporting

| ID | User Story |
|---|---|
| US-050 | As a **business owner**, I want a monthly dashboard showing total revenue, total expenses, and profit so that I understand my financial performance. |
| US-051 | As a **business owner**, I want to see revenue broken down by customer for the selected month so that I know who my most valuable customers are. |
| US-052 | As a **business owner**, I want a chart of revenue trend over the last 3, 6, or 12 months so that I can spot growth or decline. |
| US-053 | As a **business owner**, I want to see the number of jobs completed per month so that I can track operational volume. |

### Analytics & CRM

| ID | User Story |
|---|---|
| US-060 | As a **business owner**, I want to see each customer's last visit date, visit frequency, and average order value so that I can identify my most engaged customers. |
| US-061 | As a **business owner**, I want the system to flag customers who haven't visited in 30+ days so that I can follow up with them proactively. |
| US-062 | As a **business owner**, I want a list of "top customers by revenue" so that I can prioritize relationships. |
| US-063 | As a **business owner**, I want to send a bulk message to all customers in the "due for follow-up" segment so that I can re-engage them with one action. |

### Admin & Settings

| ID | User Story |
|---|---|
| US-070 | As a **business owner**, I want to update my business name, logo, service type, currency, and default unit in settings so that my profile is always accurate. |
| US-071 | As a **business owner**, I want to enter API keys for WhatsApp/Viber/SMS providers in settings so that notifications can be sent through my accounts. |
| US-072 | As a **business owner**, I want to view my current subscription tier and next billing date so that I can manage my subscription. |

---

## 3. Functional Requirements

### Authentication

| FR | Requirement | US |
|---|---|---|
| FR-001 | The system SHALL allow a business owner to register using email and password. | US-001 |
| FR-002 | The system SHALL send an email with a confirmation link upon registration. | US-002 |
| FR-003 | The system SHALL prevent login until the email is confirmed. | US-002 |
| FR-004 | The system SHALL authenticate users via JWT tokens. Tokens expire after 24 hours (web) or 30 days (mobile, refresh token). | US-003 |
| FR-005 | The system SHALL provide password reset via a time-limited email link (expires in 1 hour). | US-004 |
| FR-006 | The system SHALL enforce HTTPS on all endpoints. | (NFR) |
| FR-007 | The system SHALL hash passwords using bcrypt (min cost factor 12). | (NFR) |

### Business Setup

| FR | Requirement | US |
|---|---|---|
| FR-010 | The system SHALL require business name and service type to be set during onboarding before any features are usable. | US-005 |
| FR-011 | The system SHALL support configurable currency (default EUR). | US-005 |
| FR-012 | The system SHALL support configurable default unit of measurement (kg, m², pieces). | US-005 |
| FR-013 | The system SHALL allow the owner to store API keys for WhatsApp, SMS, and Viber providers. API keys SHALL be stored encrypted. | US-006, US-071 |

### Customer Management

| FR | Requirement | US |
|---|---|---|
| FR-020 | The system SHALL allow creating a customer with: name (required), phone (required), email (optional), address (optional), rate per unit (optional), notes (optional). | US-010 |
| FR-021 | The system SHALL validate phone number format on customer creation. | US-010 |
| FR-022 | The system SHALL allow editing all customer fields at any time. Rate changes apply to future jobs only. | US-011 |
| FR-023 | The system SHALL allow deleting a customer. Deleted customers' jobs SHALL remain in history (soft delete). | US-012 |
| FR-024 | The system SHALL support full-text search on customer name and phone number. | US-013 |
| FR-025 | The system SHALL allow filtering customers by notification channel preference. | US-013, US-014 |
| FR-026 | The system SHALL allow assigning a preferred notification channel (WhatsApp / Viber / SMS / None) per customer. | US-014 |

### Job Management

| FR | Requirement | US |
|---|---|---|
| FR-030 | The system SHALL allow creating a job linked to a customer with: quantity (required, numeric), unit (auto-filled from business setting), rate (auto-filled from customer, displayed), expected delivery date (required), photos (optional), notes (optional). | US-020 |
| FR-031 | The system SHALL auto-calculate job price as `floor(Quantity × Rate × 100) / 100` (round down to 2 decimals). | US-021 |
| FR-032 | The system SHALL display the calculated price before the owner saves the job. | US-021 |
| FR-033 | The system SHALL support job status transitions: Received → Processing → Completed → Delivered. No backwards transitions allowed. | US-022 |
| FR-034 | The system SHALL record the timestamp of each status transition. | US-022 |
| FR-035 | The system SHALL allow uploading up to 10 photos per job from mobile camera or gallery. | US-023 |
| FR-036 | Photos SHALL be stored on cloud storage (AWS S3 or equivalent). URLs SHALL be signed/CDN-served. | US-023 |
| FR-037 | The system SHALL support creating a new customer inline during new job creation. | US-027 |
| FR-038 | The system SHALL display a list of all jobs with visible status, customer name, expected delivery date, and price. List SHALL be paginated (20 per page). | US-025 |
| FR-039 | The system SHALL allow filtering jobs by: status, customer, date range (received date or delivery date). | US-026 |

### Notifications

| FR | Requirement | US |
|---|---|---|
| FR-040 | The system SHALL automatically send a "job received" notification to the customer's preferred channel when a job status is set to Received. Message: `"Your order has been received. Expected delivery: [date]."` | US-030 |
| FR-041 | The system SHALL run a daily scheduled job to send 1-day-before-delivery reminder notifications to all customers whose job expected delivery date is tomorrow. | US-031 |
| FR-042 | The system SHALL automatically send a "job delivered" notification when status is updated to Delivered. Message includes calculated price: `"Your order is ready. Total: €[price]."` | US-032 |
| FR-043 | Notification delivery SHALL fail gracefully: if a channel API call fails, log the error, mark notification as failed, and do NOT crash the job update. | (NFR) |
| FR-044 | The system SHALL allow the owner to send a manual message to a single customer via their preferred channel. | US-033 |
| FR-045 | Manual messaging SHALL support: selecting a template OR writing a custom message. | US-034 |
| FR-046 | The system SHALL provide 3+ default message templates with variable substitution: `[customer_name]`, `[date]`, `[amount]`. | US-035 |
| FR-047 | The system SHALL allow customizing templates in settings. Templates SHALL be stored per business account. | US-035 |

### Expense Tracking

| FR | Requirement | US |
|---|---|---|
| FR-050 | The system SHALL allow logging an expense with: amount (required, numeric, ≥ 0.01), category (required, from fixed list + Other), description (optional), date (required, defaults to today). | US-040 |
| FR-051 | The system SHALL support editing and deleting logged expenses. | US-041 |
| FR-052 | The system SHALL display all expenses for a selected month, sorted by date descending. | US-042 |

### Financial Reporting

| FR | Requirement | US |
|---|---|---|
| FR-060 | The system SHALL compute monthly income as sum of all Completed + Delivered job prices for the selected month. | US-050 |
| FR-061 | The system SHALL compute monthly expense as sum of all logged expenses for the selected month. | US-050 |
| FR-062 | The system SHALL compute monthly profit as income − expenses. | US-050 |
| FR-063 | The system SHALL display a revenue-by-customer breakdown for the selected month, sorted descending by revenue. | US-051 |
| FR-064 | The system SHALL provide a revenue trend chart for last 3 / 6 / 12 months (selectable). | US-052 |
| FR-065 | The system SHALL display jobs completed per month for the same selectable period. | US-053 |

### Analytics & CRM

| FR | Requirement | US |
|---|---|---|
| FR-070 | The system SHALL compute and display per customer: last visit date, visit count (30/60/90 day windows), average order value. | US-060 |
| FR-071 | The system SHALL flag customers as "due for follow-up" if their last job was more than 30 days ago. | US-061 |
| FR-072 | The system SHALL provide a "Top customers by revenue" list (all-time), top 10 default. | US-062 |
| FR-073 | The system SHALL allow the owner to send a single bulk message to all customers in the "due for follow-up" segment. Bulk message sends individually (not CC/BCC). | US-063 |

### Admin

| FR | Requirement | US |
|---|---|---|
| FR-080 | The system SHALL allow updating business name, logo (image upload), service type, currency, and default unit from settings. | US-070 |
| FR-081 | The system SHALL display current subscription tier name and next billing date. Actual billing is a placeholder in MVP. | US-072 |
| FR-082 | The system SHALL comply with GDPR: provide data export on request and account deletion with data erasure. | (NFR) |

### Mobile-Specific

| FR | Requirement | US |
|---|---|---|
| FR-090 | The mobile app SHALL operate in offline mode: allow viewing and creating jobs, customers, and expenses while offline. | (US-003) |
| FR-091 | The mobile app SHALL auto-sync local offline data to the server when internet connection is restored. | (NFR) |
| FR-092 | The mobile app SHALL indicate to the user when it is operating in offline mode. | (NFR) |
| FR-093 | The mobile app SHALL support pagination and lazy loading for all long lists. | (NFR) |

---

## 4. Non-Functional Requirements

| NFR | Category | Requirement |
|---|---|---|
| NFR-001 | Performance | Web app initial load < 3 seconds on broadband |
| NFR-002 | Performance | Mobile app cold launch < 2 seconds |
| NFR-003 | Performance | API average response time < 500ms for typical queries |
| NFR-004 | Scalability | Database must handle 10,000+ customer records per business without degradation |
| NFR-005 | Scalability | API must handle 100 concurrent users per tenant without degradation |
| NFR-006 | Security | HTTPS enforced on all endpoints; no HTTP fall-through |
| NFR-007 | Security | API rate limiting: max 100 req/min per authenticated user |
| NFR-008 | Security | No hardcoded secrets in source code; all keys via environment variables |
| NFR-009 | Privacy | GDPR compliant: data export and account deletion |
| NFR-010 | Reliability | Notification failures must not crash job updates (graceful degradation) |
| NFR-011 | Mobile | Offline-first: all core operations available without connectivity |
| NFR-012 | Accessibility | WCAG 2.1 Level AA on web |

---

## 5. Data Models (Logical)

### User / Business Account
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| email | string | Unique, required |
| password_hash | string | bcrypt |
| email_verified | boolean | Default false |
| business_name | string | Required |
| service_type | string | e.g., "Laundry", "Carpet Cleaning" |
| currency | string | ISO code, default "EUR" |
| default_unit | string | "kg" / "m²" / "pieces" |
| logo_url | string | Optional, cloud storage URL |
| whatsapp_api_key | string | Encrypted |
| sms_api_key | string | Encrypted |
| viber_api_key | string | Encrypted |
| subscription_tier | string | "MVP" placeholder |
| subscription_renewal_date | date | Placeholder |
| created_at | timestamp | |

### Customer
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| business_id | UUID | FK → User |
| name | string | Required |
| phone | string | Required |
| email | string | Optional |
| address | string | Optional |
| rate_per_unit | decimal(10,2) | Optional |
| notes | text | Optional |
| preferred_channel | enum | WhatsApp / Viber / SMS / None |
| is_deleted | boolean | Soft delete |
| created_at | timestamp | |
| updated_at | timestamp | |

### Job
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| business_id | UUID | FK → User |
| customer_id | UUID | FK → Customer |
| quantity | decimal(10,3) | Required |
| unit | string | Inherited from business setting |
| rate | decimal(10,2) | Snapshot of customer rate at job creation |
| total_price | decimal(10,2) | Quantity × Rate |
| status | enum | Received / Processing / Completed / Delivered |
| expected_delivery_date | date | Required |
| actual_delivery_date | date | Set when Delivered |
| notes | text | Optional |
| received_at | timestamp | |
| processing_at | timestamp | |
| completed_at | timestamp | |
| delivered_at | timestamp | |
| created_at | timestamp | |

### JobPhoto
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| job_id | UUID | FK → Job |
| url | string | Cloud storage signed URL |
| uploaded_at | timestamp | |

### Expense
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| business_id | UUID | FK → User |
| amount | decimal(10,2) | Required, > 0 |
| category | enum | Supplies / Fuel / Rent / Utilities / Marketing / Other |
| description | string | Optional |
| date | date | Required |
| created_at | timestamp | |

### MessageTemplate
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| business_id | UUID | FK → User |
| name | string | e.g., "Job Received" |
| body | text | Supports [customer_name], [date], [amount] |
| is_system | boolean | True for defaults (non-deletable) |

### NotificationLog
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| business_id | UUID | FK → User |
| customer_id | UUID | FK → Customer |
| job_id | UUID | FK → Job (nullable for manual) |
| channel | enum | WhatsApp / Viber / SMS |
| message_body | text | Actual sent text |
| status | enum | Sent / Failed |
| error_message | string | Populated on failure |
| sent_at | timestamp | |

---

## 6. UI/UX Screen Descriptions

### Web & Mobile shared screens:

**Login Screen**
- Email + password fields, Submit button
- "Forgot password?" link → triggers email
- Link to registration

**Registration Screen**
- Email, password, confirm password
- On submit → confirmation email sent → "Check your email" state shown

**Onboarding Flow** (first login after email confirm)
- Step 1: Business name + service type (required)
- Step 2: Currency + default measurement unit
- Step 3: Notification channel setup (API keys — can skip, configurable later)
- Step 4: Optional first customer/job creation prompt

**Dashboard**
- Monthly summary card: Revenue / Expenses / Profit
- Quick actions: New Job, New Customer
- Jobs due today or overdue (highlighted)
- Revenue trend mini-chart (last 3 months)

**Customer List**
- Search bar at top
- Sortable list: name, phone, last visit
- Filter panel: channel, follow-up status
- Tap → Customer Detail

**Customer Detail**
- Profile fields (editable inline)
- Job history list (linked)
- CRM stats: last visit, frequency, avg order
- "Send Message" button
- "Due for follow-up" badge (if applicable)

**Job List**
- Filterable by status, date, customer
- Each row: customer name, status badge, expected delivery, price
- Tap → Job Detail

**Job Detail**
- All job fields displayed
- Status update button (advances to next status only)
- Photo gallery (upload + view)
- Notification history section (which notifications sent)
- Notes field

**New Job Screen**
- Customer picker (search existing or create new inline)
- Quantity input → auto-shows calculated price
- Expected delivery date picker
- Photo upload
- Notes
- Save + sends automatic notification

**Expense List / Log**
- Month picker
- List of expenses for month + total
- Add Expense button

**Reports Screen**
- Month picker
- Cards: Revenue, Expenses, Profit
- Revenue by customer table
- Revenue trend chart (3/6/12 month toggle)
- Jobs count chart

**CRM / Analytics Screen**
- Customer list sorted by last visit / revenue
- "Due for follow-up" filter tab
- Top 10 customers by revenue
- Bulk message button for follow-up segment

**Settings Screen**
- Business profile section
- Notification channels section (API keys per channel)
- Message templates editor
- Subscription info (static display)
- GDPR: Data export + Delete account

---

## 7. Out of Scope

- Multi-staff management
- Customer self-service portal
- Payment processing / invoicing
- Inventory and stock tracking
- Barcode / QR scanning
- Tax reporting / accounting integration
- Multi-location support
- Delivery receipt tracking for notifications

---

## 8. Changelog

| Date | Author | Change |
|---|---|---|
| 2026-03-07 | BA | v1.0 initial spec created |
