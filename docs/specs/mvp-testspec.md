# Test Specification — Service Business Platform MVP

**Prepared by**: BA Agent  
**Date**: 2026-03-07  
**Version**: 1.0  
**For**: QA Agent execution + DEV Agent unit test writing  
**Linked Spec**: `docs/specs/mvp-spec.md`

---

## Acceptance Criteria

### US-001 — Registration

| ID | Acceptance Criterion |
|---|---|
| AC-US001-01 | GIVEN a user with a new email WHEN they submit the registration form with valid email and password (min 8 chars) THEN an account is created and a confirmation email is sent |
| AC-US001-02 | GIVEN a user submits registration WHEN the email is already registered THEN the system returns an error "Email already in use" and does not create a duplicate account |
| AC-US001-03 | GIVEN a user submits registration WHEN the password is fewer than 8 characters THEN the system returns a validation error before submission |
| AC-US001-04 | GIVEN a user submits registration WHEN the email format is invalid THEN the system returns a validation error |

### US-002 — Email Confirmation

| ID | Acceptance Criterion |
|---|---|
| AC-US002-01 | GIVEN a registered user WHEN they click the confirmation link in the email THEN their account is marked verified |
| AC-US002-02 | GIVEN an unverified user WHEN they attempt to log in THEN the system rejects login with "Please verify your email" |
| AC-US002-03 | GIVEN a user WHEN they click an expired confirmation link (> 24h) THEN the system shows an error and offers to resend a new link |

### US-003 — Login

| ID | Acceptance Criterion |
|---|---|
| AC-US003-01 | GIVEN a verified user WHEN they submit correct email and password THEN they receive a valid JWT and are redirected to dashboard |
| AC-US003-02 | GIVEN a user WHEN they submit wrong password THEN login is rejected with "Invalid credentials" (no account existence disclosure) |
| AC-US003-03 | GIVEN a logged-in user WHEN 24 hours pass on web THEN their session expires and they must re-authenticate |
| AC-US003-04 | GIVEN a logged-in mobile user WHEN the access token expires THEN the app uses the refresh token silently without forcing re-login (up to 30 days) |

### US-010 — Create Customer

| ID | Acceptance Criterion |
|---|---|
| AC-US010-01 | GIVEN a business owner WHEN they create a customer with required fields (name, phone) THEN the customer appears in their customer list |
| AC-US010-02 | GIVEN a business owner WHEN they submit a customer without name or phone THEN the system rejects with validation error |
| AC-US010-03 | GIVEN a business owner WHEN they submit a customer with an invalid phone format THEN the system returns a validation error |
| AC-US010-04 | GIVEN a business owner WHEN they set a customer rate THEN that rate is used in future job price calculations |

### US-021 — Pricing Calculation

| ID | Acceptance Criterion |
|---|---|
| AC-US021-01 | GIVEN a customer with rate €5.00/kg WHEN a job is created with 10 kg THEN total price = €50.00 |
| AC-US021-02 | GIVEN a customer with rate €3.50/m² WHEN a job is created with 7.5 m² THEN total price = €26.25 |
| AC-US021-03 | GIVEN a job is being created WHEN the quantity is entered THEN the calculated price is shown in real time before saving |
| AC-US021-04 | GIVEN a customer with no set rate WHEN a job is created THEN the system prompts the owner to enter a rate before saving |

### US-022 — Job Status

| ID | Acceptance Criterion |
|---|---|
| AC-US022-01 | GIVEN a job in "Received" status WHEN the owner taps "Update" THEN the next status is "Processing" (not Completed or Delivered) |
| AC-US022-02 | GIVEN a job in "Delivered" status WHEN the owner attempts another status update THEN no forward transition is available |
| AC-US022-03 | GIVEN a job status changes WHEN the transition occurs THEN the timestamp for that status is recorded |

### US-030 / US-031 / US-032 — Automated Notifications

| ID | Acceptance Criterion |
|---|---|
| AC-US030-01 | GIVEN a job is saved with status Received WHEN the customer has a preferred channel set THEN a "job received" notification is sent within 5 seconds |
| AC-US030-02 | GIVEN a job is saved WHEN the notification channel API call fails THEN the job is still saved and the error is logged (no crash) |
| AC-US031-01 | GIVEN a job has an expected delivery date of tomorrow WHEN the daily scheduler runs THEN the customer receives a reminder notification |
| AC-US031-02 | GIVEN a job has already been delivered WHEN the daily scheduler runs THEN no reminder is sent |
| AC-US032-01 | GIVEN a job status is updated to Delivered WHEN the change is saved THEN a "job ready" notification including price is sent to the customer |

### US-040 — Expense Logging

| ID | Acceptance Criterion |
|---|---|
| AC-US040-01 | GIVEN a business owner WHEN they log an expense with amount, category, date THEN it appears in the expense list for that month |
| AC-US040-02 | GIVEN a business owner WHEN they submit an expense with amount = 0 or negative THEN the system returns a validation error |
| AC-US040-03 | GIVEN a business owner WHEN they edit an expense THEN the updated values replace the old ones |

### US-050 — Financial Dashboard

| ID | Acceptance Criterion |
|---|---|
| AC-US050-01 | GIVEN a selected month WHEN the dashboard loads THEN revenue = sum of all Completed+Delivered job prices for that month |
| AC-US050-02 | GIVEN a selected month WHEN the dashboard loads THEN expenses = sum of all logged expenses for that month |
| AC-US050-03 | GIVEN revenue and expenses are computed THEN profit = revenue − expenses (can be negative) |

### US-061 — Follow-Up Flagging

| ID | Acceptance Criterion |
|---|---|
| AC-US061-01 | GIVEN a customer whose last job was 31+ days ago THEN they appear in the "due for follow-up" filter |
| AC-US061-02 | GIVEN a customer whose last job was 29 days ago THEN they do NOT appear in the "due for follow-up" filter |

### US-063 — Bulk Messaging

| ID | Acceptance Criterion |
|---|---|
| AC-US063-01 | GIVEN the owner taps "Bulk message follow-up" WHEN there are 5 customers in the segment THEN 5 individual messages are sent (not a group message) |
| AC-US063-02 | GIVEN a bulk message WHEN any individual send fails THEN the remaining customers still receive their messages and the failure is logged |

---

## Test Cases

### TC-001: Successful User Registration
**Type**: integration  
**Prerequisite**: Clean database, no existing account for test email  
**Steps**:
1. POST `/api/auth/register` with `{ email: "test@test.com", password: "Password123" }`
2. Check HTTP 201 response
3. Check database row exists for user
4. Check email_verified = false
5. Verify confirmation email sent (mock or check mail provider)
**Expected Result**: 201 Created, user row created, email_verified=false, confirmation email queued  
**Linked AC**: AC-US001-01

---

### TC-002: Duplicate Email Registration
**Type**: integration  
**Prerequisite**: User with test@test.com already exists  
**Steps**:
1. POST `/api/auth/register` with same email
2. Check HTTP 409 response
3. Verify only 1 user row in DB
**Expected Result**: 409 Conflict, "Email already in use", no duplicate record  
**Linked AC**: AC-US001-02

---

### TC-003: Login with correct credentials
**Type**: integration  
**Prerequisite**: Verified user exists  
**Steps**:
1. POST `/api/auth/login`
2. Check HTTP 200 + JWT token in response
3. Decode JWT — verify user ID matches
**Expected Result**: 200 OK, valid JWT returned  
**Linked AC**: AC-US003-01

---

### TC-004: Login with wrong password
**Type**: integration  
**Steps**:
1. POST `/api/auth/login` with wrong password
2. Check HTTP 401
3. Response must NOT say whether email exists or not
**Expected Result**: 401 Unauthorized, generic "Invalid credentials"  
**Linked AC**: AC-US003-02

---

### TC-005: Pricing calculation — standard case
**Type**: unit  
**Steps**:
1. Call `calculatePrice(quantity=10, rate=5.00)`
2. Assert result = 50.00
**Expected Result**: 50.00  
**Linked AC**: AC-US021-01

---

### TC-006: Pricing calculation — fractional
**Type**: unit  
**Steps**:
1. Call `calculatePrice(quantity=7.5, rate=3.50)`
2. Assert result = 26.25
**Expected Result**: 26.25  
**Linked AC**: AC-US021-02

---

### TC-007: Pricing calculation — rounding
**Type**: unit  
**Steps**:
1. Call `calculatePrice(quantity=3, rate=1.333)`
2. Assert result = 3.99 (floor to 2 decimal places)
**Expected Result**: 3.99  
**Linked AC**: AC-US021-01

---

### TC-008: Job status — valid forward transition
**Type**: unit  
**Steps**:
1. Create job with status=Received
2. Call `advanceStatus(job)` → assert status = Processing
3. Call again → assert status = Completed
4. Call again → assert status = Delivered
**Expected Result**: Transitions follow correct sequence  
**Linked AC**: AC-US022-01

---

### TC-009: Job status — no backward transition
**Type**: unit  
**Steps**:
1. Create job with status=Delivered
2. Attempt to call `setStatus(job, "Completed")`
3. Assert error thrown / operation rejected
**Expected Result**: Error — backward transitions not allowed  
**Linked AC**: AC-US022-02

---

### TC-010: Job status timestamps recorded
**Type**: integration  
**Steps**:
1. Create job in DB (status=Received)
2. Update status to Processing via API
3. Fetch job — assert `processing_at` is populated with recent timestamp
**Expected Result**: processing_at timestamp set  
**Linked AC**: AC-US022-03

---

### TC-011: Auto-notification on job creation
**Type**: integration  
**Prerequisite**: Customer with preferred_channel=WhatsApp, mock WhatsApp provider  
**Steps**:
1. POST `/api/jobs` with valid job data
2. Verify mock WhatsApp API called with customer's phone
3. Verify NotificationLog row created with status=Sent
**Expected Result**: Notification sent, logged  
**Linked AC**: AC-US030-01

---

### TC-012: Job saved when notification fails
**Type**: integration  
**Prerequisite**: Mock WhatsApp provider configured to return error  
**Steps**:
1. POST `/api/jobs`
2. Assert HTTP 201 (job created)
3. Verify NotificationLog row with status=Failed + error_message populated
**Expected Result**: Job saved, notification logged as failed  
**Linked AC**: AC-US030-02

---

### TC-013: Delivery reminder scheduler
**Type**: integration  
**Prerequisite**: Job with expected_delivery_date = tomorrow, status ≠ Delivered  
**Steps**:
1. Trigger reminder scheduler job manually
2. Assert customer received notification
3. Assert NotificationLog row created
**Expected Result**: Reminder sent  
**Linked AC**: AC-US031-01

---

### TC-014: No reminder for already-delivered jobs
**Type**: integration  
**Prerequisite**: Job with expected_delivery_date = tomorrow, status = Delivered  
**Steps**:
1. Trigger reminder scheduler
2. Assert no notification sent to this customer
**Expected Result**: No notification  
**Linked AC**: AC-US031-02

---

### TC-015: Monthly revenue calculation
**Type**: integration  
**Prerequisite**: 3 Completed jobs (€50, €30, €20) in March 2026. 1 Received job (€100) also in March.  
**Steps**:
1. GET `/api/reports?month=2026-03`
2. Assert revenue = 100 (only Completed + Delivered counted)
**Expected Result**: Revenue = €100.00  
**Linked AC**: AC-US050-01

---

### TC-016: Follow-up flag — 31 days
**Type**: unit  
**Steps**:
1. Customer last job completed 31 days ago
2. Call `isDueForFollowUp(customer)` 
3. Assert returns true
**Expected Result**: true  
**Linked AC**: AC-US061-01

---

### TC-017: Follow-up flag — 29 days
**Type**: unit  
**Steps**:
1. Customer last job completed 29 days ago
2. Call `isDueForFollowUp(customer)`
3. Assert returns false
**Expected Result**: false  
**Linked AC**: AC-US061-02

---

### TC-018: Bulk messaging — individual sends
**Type**: integration  
**Prerequisite**: 3 customers in follow-up segment, mock messaging provider  
**Steps**:
1. POST `/api/messages/bulk` with template
2. Assert mock provider called 3 times with 3 different phone numbers
3. Assert 3 NotificationLog rows created
**Expected Result**: 3 individual messages sent  
**Linked AC**: AC-US063-01

---

### TC-019: Bulk messaging — partial failure
**Type**: integration  
**Prerequisite**: Customer 2 of 3 will fail (mock configured)  
**Steps**:
1. POST `/api/messages/bulk`
2. Assert customer 1 and 3 got messages
3. Assert customer 2 NotificationLog = Failed
4. Assert API returns 207 Multi-Status with details
**Expected Result**: 2 sent, 1 failed, all logged  
**Linked AC**: AC-US063-02

---

### TC-020: E2E — Full job lifecycle (web)
**Type**: e2e  
**Steps**:
1. Login as business owner (web)
2. Create new customer with phone, rate=5.00/kg
3. Create new job: 10kg, delivery tomorrow
4. Assert price shown = €50.00
5. Assert automatic notification sent (check notification log)
6. Advance status to Processing, then Completed, then Delivered
7. Assert delivered notification sent
8. Check Reports → this month revenue includes €50.00
**Expected Result**: All steps pass  
**Linked AC**: AC-US021-01, AC-US030-01, AC-US032-01, AC-US050-01

---

### TC-021: E2E — Full job lifecycle (mobile iOS)
**Type**: e2e  
**Platform**: iOS Simulator  
**Steps**: Same as TC-020 from Flutter iOS app  
**Expected Result**: All steps pass on iOS  
**Linked AC**: AC-US021-01, AC-US030-01

---

### TC-022: E2E — Full job lifecycle (mobile Android)
**Type**: e2e  
**Platform**: Android Emulator  
**Steps**: Same as TC-020 from Flutter Android app  
**Expected Result**: All steps pass on Android  
**Linked AC**: AC-US021-01, AC-US030-01

---

### TC-023: Mobile offline — create job offline
**Type**: integration  
**Steps**:
1. Set mobile app to airplane mode
2. Create a new job (customer already synced)
3. Verify job appears in local list with "offline" indicator
4. Restore network
5. Wait for sync
6. Verify job appears in server DB
**Expected Result**: Job syncs successfully after reconnection  
**Linked AC**: FR-090, FR-091

---

### TC-024: API rate limiting
**Type**: performance  
**Steps**:
1. Send 101 requests/min from same authenticated user
2. Assert request 101 returns HTTP 429
**Expected Result**: 429 Too Many Requests  
**Linked AC**: NFR-007

---

### TC-025: API response time
**Type**: performance  
**Steps**:
1. Send 50 sequential requests to `/api/customers` (with 100 customers)
2. Record response times
**Expected Result**: Average response time < 500ms  
**Linked AC**: NFR-003

---

### TC-026: Expense validation — zero amount
**Type**: unit  
**Steps**:
1. POST `/api/expenses` with amount=0
2. Assert HTTP 400 validation error
**Expected Result**: 400 Bad Request  
**Linked AC**: AC-US040-02

---

### TC-027: Regression — new job does not break customer stats
**Type**: regression  
**Steps**:
1. Customer with 5 existing jobs
2. Add new job
3. Verify customer's visit count and average order value updated correctly
**Expected Result**: CRM stats recalculated accurately  
**Linked AC**: AC-US060-01 (implied)

---

### TC-028: GDPR — data export
**Type**: integration  
**Steps**:
1. POST `/api/account/export`
2. Assert ZIP or JSON file contains all customers, jobs, expenses for that business
**Expected Result**: Full data export returned  
**Linked AC**: FR-082

---

### TC-029: GDPR — account deletion
**Type**: integration  
**Steps**:
1. DELETE `/api/account`
2. Assert user row deleted
3. Assert all customers, jobs, expenses deleted
4. Assert attempting login with old credentials returns 401
**Expected Result**: All data erased, login impossible  
**Linked AC**: FR-082

---

### TC-030: Security — HTTPS-only
**Type**: integration  
**Steps**:
1. Send HTTP request to any API endpoint
2. Assert redirect to HTTPS or connection refused
**Expected Result**: No plaintext API responses  
**Linked AC**: NFR-006
