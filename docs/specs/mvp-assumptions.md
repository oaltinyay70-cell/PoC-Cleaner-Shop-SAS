# Assumptions & Clarifications — Service Business Platform MVP

**Prepared by**: BA Agent  
**Date**: 2026-03-07  
**Source**: PRD_Service_Business_Platform.docx

---

## Resolved Assumptions (Safe to proceed with)

| # | Assumption | Basis |
|---|---|---|
| A-01 | MVP targets a single business owner (single user per account). Multi-staff is explicitly post-MVP. | PRD §3 Target Users |
| A-02 | Pricing model is fixed-rate-per-unit. No per-job rate overrides in MVP. Rate changes are done via customer profile update only. | PRD §4.3 |
| A-03 | Job status flow is strictly: Received → Processing → Completed → Delivered. No backward transitions required in MVP. | PRD §4.2 |
| A-04 | Photos are attached at job level (not customer level). Mobile upload from camera or gallery. No receipt upload yet. | PRD §4.5, §4.6 |
| A-05 | Expense tracking is manual text entry only. No receipt scanning, no OCR in MVP. | PRD §4.6 |
| A-06 | Financial reporting is month-level only. No weekly, daily, or custom-range views in MVP. | PRD §4.6 |
| A-07 | Notification channels: WhatsApp Business API, Viber API, SMS (Twilio or Greek local). All 3 enabled per account but configurable per customer. | PRD §4.4, §5.3 |
| A-08 | Tech stack: iOS/Android mobile = Flutter (project constraint). Backend and web stack = DEV's decision. | Project constraint + PRD §5.2 |
| A-09 | Offline mode required on mobile only. Web app requires active internet connection. | PRD §5.3 Data Sync |
| A-10 | GDPR applies (user data export + deletion on request). Likely EU market (Greek providers mentioned). | PRD §8 Security |
| A-11 | Currency defaults to EUR. Configurable per business (e.g., GBP). | PRD §7 Admin Panel |
| A-12 | "Delivered" and "Completed" are treated as two distinct statuses. Completed = ready for pickup; Delivered = handed to customer. | PRD §6.3 |
| A-13 | Bulk messaging to filtered customer segments is in MVP scope (repeat customers). | PRD §4.7 |
| A-14 | Subscription billing UI (current tier, next date, invoice download) is a placeholder in MVP — no actual payment processing yet. | PRD §7 Admin Panel |
| A-15 | Real-time sync across devices (web + mobile same session) is required but eventual consistency (few-second delay) is acceptable. | PRD §5.3 |

---

## Open Questions (Non-blocking — will use assumption if not answered before spec finalization)

| # | Question | Impact | Default Assumption |
|---|---|---|---|
| Q-01 | What is the maximum number of photos per job? | Storage cost, UI design | Assume 10 photos per job |
| Q-02 | Are notification templates fully customizable by owner, or just variable substitution (name, date, amount)? | UI complexity | Assume variable substitution only (name, date, amount) |
| Q-03 | Should the system track undelivered notifications (e.g., WhatsApp delivery receipt)? | Backend complexity | Assume no delivery tracking in MVP |
| Q-04 | Is there a difference between "Completed" (ready) and "Delivered" statuses, or should delivered auto-trigger the final notification? | Notification automation logic | Assume separate status; final notification fires on "Delivered" |
| Q-05 | For CRM "due for follow-up" (30+ days), is this configurable per business or fixed at 30 days? | Settings complexity | Assume fixed at 30 days in MVP |
| Q-06 | Are expense categories fixed (supplies, fuel, rent, etc.) or user-defined? | DB schema | Assume fixed set with "Other" catch-all |
| Q-07 | Should the mobile app support barcode/QR scanning for job identification? | Hardware integration | Assume NO — out of scope for MVP |

---

## Out of Scope for MVP (Explicitly from PRD §9)

- Multi-staff / role-based permissions
- In-app customer payment processing
- Customer self-service portal
- Inventory tracking
- Invoice/PDF generation and email
- Tax reporting
- Multi-location / chain management
- Accounting software integration
