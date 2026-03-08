/**
 * FULL E2E Test Suite — covers EVERY endpoint.
 * Starts server on port 3002, runs all tests, reports results, exits.
 */
import app from './index';

const PORT = 3002;
const BASE = `http://localhost:${PORT}`;

let passed = 0;
let failed = 0;
const failures: string[] = [];

function ok(name: string, detail?: string) {
    passed++;
    console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name: string, err: unknown) {
    failed++;
    const msg = err instanceof Error ? err.message : String(err);
    failures.push(`${name}: ${msg}`);
    console.log(`  ❌ ${name} — ${msg}`);
}

function assert(cond: boolean, msg: string) {
    if (!cond) throw new Error(msg);
}

async function run() {
    const server = app.listen(PORT, async () => {
        console.log(`\n🧪 FULL E2E Suite — port ${PORT}\n`);

        let token = '';
        let userId = '';
        let custId = '';
        let jobId = '';
        let expenseId = '';
        const headers = () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });

        try {
            // ═══════════════════════════════════════════
            // SECTION 1: AUTH
            // ═══════════════════════════════════════════
            console.log('\n── AUTH ──');

            // 1. Register
            try {
                const res = await fetch(`${BASE}/api/auth/register`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: `test${Date.now()}@test.com`, password: 'testpass123' }),
                });
                const d = await res.json() as any;
                assert(res.status === 201, `Expected 201, got ${res.status}`);
                assert(d.message?.includes('successful'), 'No success message');
                ok('Register new user');
            } catch (e) { fail('Register new user', e); }

            // 2. Register duplicate
            try {
                const res = await fetch(`${BASE}/api/auth/register`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'demo@serviceplatform.com', password: 'testpass123' }),
                });
                assert(res.status === 409, `Expected 409, got ${res.status}`);
                ok('Register duplicate rejected', '409');
            } catch (e) { fail('Register duplicate rejected', e); }

            // 3. Register bad email
            try {
                const res = await fetch(`${BASE}/api/auth/register`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'not-an-email', password: 'testpass123' }),
                });
                assert(res.status === 400, `Expected 400, got ${res.status}`);
                ok('Register bad email rejected', '400');
            } catch (e) { fail('Register bad email rejected', e); }

            // 4. Register short password
            try {
                const res = await fetch(`${BASE}/api/auth/register`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'short@test.com', password: '123' }),
                });
                assert(res.status === 400, `Expected 400, got ${res.status}`);
                ok('Register short password rejected', '400');
            } catch (e) { fail('Register short password rejected', e); }

            // 5. Login
            try {
                const res = await fetch(`${BASE}/api/auth/login`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'demo@serviceplatform.com', password: 'demo1234' }),
                });
                const d = await res.json() as any;
                assert(res.status === 200, `Expected 200, got ${res.status}`);
                assert(!!d.accessToken, 'No access token');
                assert(!!d.refreshToken, 'No refresh token');
                token = d.accessToken;
                userId = d.userId;
                ok('Login', `userId: ${userId.substring(0, 8)}...`);
            } catch (e) { fail('Login', e); }

            // 6. Login wrong password
            try {
                const res = await fetch(`${BASE}/api/auth/login`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'demo@serviceplatform.com', password: 'wrong' }),
                });
                assert(res.status === 401, `Expected 401, got ${res.status}`);
                ok('Login wrong password', '401');
            } catch (e) { fail('Login wrong password', e); }

            // 7. Login nonexistent user
            try {
                const res = await fetch(`${BASE}/api/auth/login`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'nobody@nowhere.com', password: 'pass1234' }),
                });
                assert(res.status === 401, `Expected 401, got ${res.status}`);
                ok('Login nonexistent user', '401');
            } catch (e) { fail('Login nonexistent user', e); }

            // 8. Auth guard — no token
            try {
                const res = await fetch(`${BASE}/api/customers`);
                assert(res.status === 401, `Expected 401, got ${res.status}`);
                ok('Auth guard no token', '401');
            } catch (e) { fail('Auth guard no token', e); }

            // 9. Auth guard — bad token
            try {
                const res = await fetch(`${BASE}/api/customers`, {
                    headers: { Authorization: 'Bearer fake.token.here' },
                });
                assert(res.status === 401, `Expected 401, got ${res.status}`);
                ok('Auth guard bad token', '401');
            } catch (e) { fail('Auth guard bad token', e); }

            // 10. Refresh token
            try {
                const loginRes = await fetch(`${BASE}/api/auth/login`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'demo@serviceplatform.com', password: 'demo1234' }),
                });
                const loginD = await loginRes.json() as any;
                const res = await fetch(`${BASE}/api/auth/refresh`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: loginD.refreshToken }),
                });
                const d = await res.json() as any;
                assert(res.status === 200, `Expected 200, got ${res.status}`);
                assert(!!d.accessToken, 'No new access token');
                ok('Refresh token', 'new token received');
            } catch (e) { fail('Refresh token', e); }

            // 11. Forgot password (stub)
            try {
                const res = await fetch(`${BASE}/api/auth/forgot-password`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'demo@serviceplatform.com' }),
                });
                assert(res.status === 200, `Expected 200, got ${res.status}`);
                ok('Forgot password', 'stub returns OK');
            } catch (e) { fail('Forgot password', e); }

            // ═══════════════════════════════════════════
            // SECTION 2: BUSINESS PROFILE
            // ═══════════════════════════════════════════
            console.log('\n── BUSINESS ──');

            // 12. Get profile
            try {
                const res = await fetch(`${BASE}/api/business/profile`, { headers: headers() });
                const d = await res.json() as any;
                assert(res.status === 200, `Expected 200, got ${res.status}`);
                assert(d.businessName === 'Clean & Fresh Carpet Services', `Wrong name: ${d.businessName}`);
                ok('Get profile', d.businessName);
            } catch (e) { fail('Get profile', e); }

            // 13. Update profile
            try {
                const res = await fetch(`${BASE}/api/business/profile`, {
                    method: 'PUT', headers: headers(),
                    body: JSON.stringify({ businessName: 'Updated Business Name', currency: 'USD' }),
                });
                assert(res.status === 200, `Expected 200, got ${res.status}`);
                // Verify
                const verify = await fetch(`${BASE}/api/business/profile`, { headers: headers() });
                const d = await verify.json() as any;
                assert(d.businessName === 'Updated Business Name', `Name not updated: ${d.businessName}`);
                assert(d.currency === 'USD', `Currency not updated: ${d.currency}`);
                ok('Update profile', 'name + currency changed');
                // Revert
                await fetch(`${BASE}/api/business/profile`, {
                    method: 'PUT', headers: headers(),
                    body: JSON.stringify({ businessName: 'Clean & Fresh Carpet Services', currency: 'EUR' }),
                });
            } catch (e) { fail('Update profile', e); }

            // ═══════════════════════════════════════════
            // SECTION 3: CUSTOMERS (FULL CRUD)
            // ═══════════════════════════════════════════
            console.log('\n── CUSTOMERS ──');

            // 14. List customers
            try {
                const res = await fetch(`${BASE}/api/customers`, { headers: headers() });
                const d = await res.json() as any;
                assert(d.total >= 5, `Expected >=5, got ${d.total}`);
                ok('List customers', `${d.total} found`);
            } catch (e) { fail('List customers', e); }

            // 15. Create customer
            try {
                const res = await fetch(`${BASE}/api/customers`, {
                    method: 'POST', headers: headers(),
                    body: JSON.stringify({ name: 'E2E Test Customer', phone: '+905551234567', email: 'e2e@test.com', ratePerUnit: 12.50 }),
                });
                const d = await res.json() as any;
                assert(res.status === 201, `Expected 201, got ${res.status}`);
                assert(d.name === 'E2E Test Customer', `Wrong name: ${d.name}`);
                custId = d.id;
                ok('Create customer', custId.substring(0, 8));
            } catch (e) { fail('Create customer', e); }

            // 16. Get customer detail (with CRM stats)
            try {
                const res = await fetch(`${BASE}/api/customers/${custId}`, { headers: headers() });
                const d = await res.json() as any;
                assert(res.status === 200, `Expected 200, got ${res.status}`);
                assert(d.name === 'E2E Test Customer', `Wrong name`);
                assert(d.stats !== undefined, 'No CRM stats');
                assert(d.stats.totalJobs === 0, `Expected 0 jobs, got ${d.stats.totalJobs}`);
                ok('Get customer detail + CRM stats', `totalJobs: ${d.stats.totalJobs}`);
            } catch (e) { fail('Get customer detail + CRM stats', e); }

            // 17. Update customer
            try {
                const res = await fetch(`${BASE}/api/customers/${custId}`, {
                    method: 'PUT', headers: headers(),
                    body: JSON.stringify({ name: 'Updated E2E Customer', notes: 'VIP client' }),
                });
                assert(res.status === 200, `Expected 200, got ${res.status}`);
                ok('Update customer');
            } catch (e) { fail('Update customer', e); }

            // 18. Create with bad data (missing phone)
            try {
                const res = await fetch(`${BASE}/api/customers`, {
                    method: 'POST', headers: headers(),
                    body: JSON.stringify({ name: 'Bad Customer' }),
                });
                assert(res.status === 400, `Expected 400, got ${res.status}`);
                ok('Create customer bad data', '400');
            } catch (e) { fail('Create customer bad data', e); }

            // 19. Search customers
            try {
                const res = await fetch(`${BASE}/api/customers?search=Alice`, { headers: headers() });
                const d = await res.json() as any;
                assert(d.total >= 1, `Expected >=1, got ${d.total}`);
                ok('Search customers', `"Alice" → ${d.total} result(s)`);
            } catch (e) { fail('Search customers', e); }

            // 20. Filter by channel
            try {
                const res = await fetch(`${BASE}/api/customers?channel=WHATSAPP`, { headers: headers() });
                const d = await res.json() as any;
                assert(d.total >= 1, `Expected >=1 WhatsApp customers`);
                ok('Filter by channel', `WhatsApp: ${d.total}`);
            } catch (e) { fail('Filter by channel', e); }

            // 21. Pagination
            try {
                const res = await fetch(`${BASE}/api/customers?page=1&limit=2`, { headers: headers() });
                const d = await res.json() as any;
                assert(d.customers.length <= 2, `Expected <=2, got ${d.customers.length}`);
                assert(d.page === 1, `Expected page 1`);
                ok('Pagination', `page 1, ${d.customers.length} items`);
            } catch (e) { fail('Pagination', e); }

            // 22. Follow-up customers
            try {
                const res = await fetch(`${BASE}/api/customers/followup`, { headers: headers() });
                const d = await res.json() as any;
                assert(res.status === 200, `Expected 200, got ${res.status}`);
                assert(Array.isArray(d.customers), 'No customers array');
                ok('Follow-up customers', `${d.customers.length} due`);
            } catch (e) { fail('Follow-up customers', e); }

            // 23. Top customers
            try {
                const res = await fetch(`${BASE}/api/customers/top?limit=3`, { headers: headers() });
                const d = await res.json() as any;
                assert(res.status === 200, `Expected 200, got ${res.status}`);
                assert(Array.isArray(d.customers), 'No ranked list');
                assert(d.customers.length <= 3, `Expected <=3, got ${d.customers.length}`);
                ok('Top customers', `${d.customers.length} ranked`);
            } catch (e) { fail('Top customers', e); }

            // 24. Delete customer (soft)
            try {
                const res = await fetch(`${BASE}/api/customers/${custId}`, {
                    method: 'DELETE', headers: headers(),
                });
                assert(res.status === 200, `Expected 200, got ${res.status}`);
                // Verify it's gone from list
                const verify = await fetch(`${BASE}/api/customers/${custId}`, { headers: headers() });
                assert(verify.status === 404, `Expected 404 after soft delete, got ${verify.status}`);
                ok('Delete customer (soft)', 'returns 404 after delete');
            } catch (e) { fail('Delete customer (soft)', e); }

            // ═══════════════════════════════════════════
            // SECTION 4: JOBS (FULL LIFECYCLE)
            // ═══════════════════════════════════════════
            console.log('\n── JOBS ──');

            // Create a fresh customer for job tests
            const freshCust = await (await fetch(`${BASE}/api/customers`, {
                method: 'POST', headers: headers(),
                body: JSON.stringify({ name: 'Job Test Cust', phone: '+905559876543', ratePerUnit: 8.50, preferredChannel: 'WHATSAPP' }),
            })).json() as any;

            // 25. Create job (auto-pricing)
            try {
                const res = await fetch(`${BASE}/api/jobs`, {
                    method: 'POST', headers: headers(),
                    body: JSON.stringify({
                        customerId: freshCust.id,
                        quantity: 20.5,
                        expectedDeliveryDate: new Date(Date.now() + 3 * 86400000).toISOString(),
                    }),
                });
                const d = await res.json() as any;
                assert(res.status === 201, `Expected 201, got ${res.status}`);
                // Auto-price: floor(20.5 * 8.50 * 100) / 100 = floor(17425) / 100 = 174.25
                assert(d.totalPrice === 174.25, `Expected €174.25, got €${d.totalPrice}`);
                assert(d.status === 'RECEIVED', `Expected RECEIVED, got ${d.status}`);
                jobId = d.id;
                ok('Create job + auto-pricing', `${d.quantity} × €${d.rate} = €${d.totalPrice}`);
            } catch (e) { fail('Create job + auto-pricing', e); }

            // 26. Get job detail
            try {
                const res = await fetch(`${BASE}/api/jobs/${jobId}`, { headers: headers() });
                const d = await res.json() as any;
                assert(res.status === 200, `Expected 200`);
                assert(d.customer !== undefined, 'No customer included');
                ok('Get job detail', `includes customer: ${d.customer?.name}`);
            } catch (e) { fail('Get job detail', e); }

            // 27. List jobs
            try {
                const res = await fetch(`${BASE}/api/jobs`, { headers: headers() });
                const d = await res.json() as any;
                assert(d.total >= 1, `Expected >=1 jobs`);
                ok('List jobs', `${d.total} total`);
            } catch (e) { fail('List jobs', e); }

            // 28. Status: RECEIVED → PROCESSING
            try {
                const res = await fetch(`${BASE}/api/jobs/${jobId}/status`, {
                    method: 'PUT', headers: headers(),
                    body: JSON.stringify({ status: 'PROCESSING' }),
                });
                const d = await res.json() as any;
                assert(d.status === 'PROCESSING', `Expected PROCESSING, got ${d.status}`);
                assert(d.processingAt !== null, 'processingAt not set');
                ok('Status RECEIVED→PROCESSING', `processingAt: ${d.processingAt}`);
            } catch (e) { fail('Status RECEIVED→PROCESSING', e); }

            // 29. Status: PROCESSING → COMPLETED
            try {
                const res = await fetch(`${BASE}/api/jobs/${jobId}/status`, {
                    method: 'PUT', headers: headers(),
                    body: JSON.stringify({ status: 'COMPLETED' }),
                });
                const d = await res.json() as any;
                assert(d.status === 'COMPLETED', `Expected COMPLETED`);
                assert(d.completedAt !== null, 'completedAt not set');
                ok('Status PROCESSING→COMPLETED');
            } catch (e) { fail('Status PROCESSING→COMPLETED', e); }

            // 30. Status: COMPLETED → DELIVERED
            try {
                const res = await fetch(`${BASE}/api/jobs/${jobId}/status`, {
                    method: 'PUT', headers: headers(),
                    body: JSON.stringify({ status: 'DELIVERED' }),
                });
                const d = await res.json() as any;
                assert(d.status === 'DELIVERED', `Expected DELIVERED`);
                assert(d.deliveredAt !== null, 'deliveredAt not set');
                ok('Status COMPLETED→DELIVERED');
            } catch (e) { fail('Status COMPLETED→DELIVERED', e); }

            // 31. Backward transition blocked
            try {
                const res = await fetch(`${BASE}/api/jobs/${jobId}/status`, {
                    method: 'PUT', headers: headers(),
                    body: JSON.stringify({ status: 'RECEIVED' }),
                });
                assert(res.status === 400, `Expected 400, got ${res.status}`);
                ok('Backward transition DELIVERED→RECEIVED blocked', '400');
            } catch (e) { fail('Backward transition blocked', e); }

            // 32. Skip transition blocked
            try {
                // Create another job and try to skip
                const j2 = await (await fetch(`${BASE}/api/jobs`, {
                    method: 'POST', headers: headers(),
                    body: JSON.stringify({ customerId: freshCust.id, quantity: 5, expectedDeliveryDate: new Date(Date.now() + 86400000).toISOString() }),
                })).json() as any;
                const res = await fetch(`${BASE}/api/jobs/${j2.id}/status`, {
                    method: 'PUT', headers: headers(),
                    body: JSON.stringify({ status: 'COMPLETED' }),
                });
                assert(res.status === 400, `Expected 400, got ${res.status}`);
                ok('Skip transition RECEIVED→COMPLETED blocked', '400');
            } catch (e) { fail('Skip transition blocked', e); }

            // 33. Photo upload
            try {
                const res = await fetch(`${BASE}/api/jobs/${jobId}/photos`, {
                    method: 'POST', headers: headers(),
                    body: JSON.stringify({ url: 'https://example.com/photo1.jpg' }),
                });
                assert(res.status === 201 || res.status === 200, `Expected 2xx, got ${res.status}`);
                ok('Photo upload');
            } catch (e) { fail('Photo upload', e); }

            // ═══════════════════════════════════════════
            // SECTION 5: EXPENSES (FULL CRUD)
            // ═══════════════════════════════════════════
            console.log('\n── EXPENSES ──');

            // 34. Create expense
            try {
                const res = await fetch(`${BASE}/api/expenses`, {
                    method: 'POST', headers: headers(),
                    body: JSON.stringify({ amount: 75.50, category: 'SUPPLIES', description: 'E2E test expense', date: new Date().toISOString() }),
                });
                const d = await res.json() as any;
                assert(res.status === 201, `Expected 201, got ${res.status}`);
                expenseId = d.id;
                ok('Create expense', `€${d.amount} ${d.category}`);
            } catch (e) { fail('Create expense', e); }

            // 35. List expenses
            try {
                const m = new Date().getMonth() + 1;
                const y = new Date().getFullYear();
                const res = await fetch(`${BASE}/api/expenses?month=${m}&year=${y}`, { headers: headers() });
                const d = await res.json() as any;
                assert(d.expenses.length >= 1, 'No expenses');
                ok('List expenses', `${d.expenses.length} this month, total €${d.total}`);
            } catch (e) { fail('List expenses', e); }

            // 36. Update expense
            try {
                const res = await fetch(`${BASE}/api/expenses/${expenseId}`, {
                    method: 'PUT', headers: headers(),
                    body: JSON.stringify({ amount: 99.99, description: 'Updated expense' }),
                });
                assert(res.status === 200, `Expected 200, got ${res.status}`);
                ok('Update expense', '€75.50 → €99.99');
            } catch (e) { fail('Update expense', e); }

            // 37. Delete expense
            try {
                const res = await fetch(`${BASE}/api/expenses/${expenseId}`, {
                    method: 'DELETE', headers: headers(),
                });
                assert(res.status === 200, `Expected 200, got ${res.status}`);
                ok('Delete expense');
            } catch (e) { fail('Delete expense', e); }

            // ═══════════════════════════════════════════
            // SECTION 6: REPORTS
            // ═══════════════════════════════════════════
            console.log('\n── REPORTS ──');

            // 38. Monthly report
            try {
                const res = await fetch(`${BASE}/api/reports/monthly?month=3&year=2026`, { headers: headers() });
                const d = await res.json() as any;
                assert(res.status === 200, `Expected 200`);
                assert('revenue' in d && 'expenses' in d && 'profit' in d, 'Missing fields');
                ok('Monthly report', `rev:€${d.revenue} exp:€${d.expenses} profit:€${d.profit}`);
            } catch (e) { fail('Monthly report', e); }

            // 39. Revenue by customer
            try {
                const res = await fetch(`${BASE}/api/reports/revenue-by-customer?month=3&year=2026`, { headers: headers() });
                const d = await res.json() as any;
                assert(res.status === 200, `Expected 200`);
                assert(Array.isArray(d.breakdown), 'No breakdown array');
                ok('Revenue by customer', `${d.breakdown.length} customers`);
            } catch (e) { fail('Revenue by customer', e); }

            // 40. Trend
            try {
                const res = await fetch(`${BASE}/api/reports/trend?months=6`, { headers: headers() });
                const d = await res.json() as any;
                assert(Array.isArray(d.trend), 'No trend array');
                ok('Revenue trend', `${d.trend.length} months`);
            } catch (e) { fail('Revenue trend', e); }

            // ═══════════════════════════════════════════
            // SECTION 7: NOTIFICATIONS
            // ═══════════════════════════════════════════
            console.log('\n── NOTIFICATIONS ──');

            // 41. Send notification
            try {
                const res = await fetch(`${BASE}/api/notifications/send`, {
                    method: 'POST', headers: headers(),
                    body: JSON.stringify({ customerId: freshCust.id, message: 'E2E test message' }),
                });
                const d = await res.json() as any;
                assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(d)}`);
                assert(!!d.logId, 'No logId returned');
                ok('Send notification', `logId: ${d.logId}`);
            } catch (e) { fail('Send notification', e); }

            // 42. Bulk follow-up
            try {
                const res = await fetch(`${BASE}/api/notifications/bulk`, {
                    method: 'POST', headers: headers(),
                    body: JSON.stringify({ message: 'We miss you [customer_name]! Come back for a clean.' }),
                });
                const d = await res.json() as any;
                assert(res.status === 200, `Expected 200, got ${res.status}`);
                ok('Bulk follow-up', `sent: ${d.sent}, failed: ${d.failed}`);
            } catch (e) { fail('Bulk follow-up', e); }

            // 43. List templates
            try {
                const res = await fetch(`${BASE}/api/notifications/templates`, { headers: headers() });
                const d = await res.json() as any;
                assert(res.status === 200, `Expected 200`);
                assert(d.templates.length >= 3, `Expected >=3 templates, got ${d.templates.length}`);
                ok('List templates', `${d.templates.length} templates`);
            } catch (e) { fail('List templates', e); }

            // 44. Create template
            try {
                const res = await fetch(`${BASE}/api/notifications/templates`, {
                    method: 'POST', headers: headers(),
                    body: JSON.stringify({ name: 'E2E Template', body: 'Hello [customer_name], this is a test.' }),
                });
                assert(res.status === 201 || res.status === 200, `Expected 2xx, got ${res.status}`);
                ok('Create template');
            } catch (e) { fail('Create template', e); }

            // ═══════════════════════════════════════════
            // SECTION 8: EDGE CASES
            // ═══════════════════════════════════════════
            console.log('\n── EDGE CASES ──');

            // 45. Get nonexistent customer
            try {
                const res = await fetch(`${BASE}/api/customers/00000000-0000-0000-0000-000000000000`, { headers: headers() });
                assert(res.status === 404, `Expected 404, got ${res.status}`);
                ok('Nonexistent customer', '404');
            } catch (e) { fail('Nonexistent customer', e); }

            // 46. Get nonexistent job
            try {
                const res = await fetch(`${BASE}/api/jobs/00000000-0000-0000-0000-000000000000`, { headers: headers() });
                assert(res.status === 404, `Expected 404, got ${res.status}`);
                ok('Nonexistent job', '404');
            } catch (e) { fail('Nonexistent job', e); }

            // 47. Health check
            try {
                const res = await fetch(`${BASE}/health`);
                const d = await res.json() as any;
                assert(d.status === 'ok', 'Health not ok');
                ok('Health check', d.timestamp);
            } catch (e) { fail('Health check', e); }

        } catch (e) {
            console.error('\n💀 Unexpected error:', e);
        } finally {
            console.log(`\n${'═'.repeat(50)}`);
            console.log(`  RESULTS: ${passed} passed, ${failed} failed (${passed + failed} total)`);
            if (failures.length > 0) {
                console.log(`\n  FAILURES:`);
                failures.forEach(f => console.log(`    ❌ ${f}`));
            }
            console.log(`${'═'.repeat(50)}\n`);
            console.log(failed === 0 ? '🎉 ALL TESTS PASSED!' : `⚠️  ${failed} TESTS FAILED`);
            server.close(() => process.exit(failed > 0 ? 1 : 0));
        }
    });
}

run();
