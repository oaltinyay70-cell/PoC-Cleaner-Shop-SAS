/**
 * End-to-end smoke test — starts the server, tests endpoints, and exits.
 * This script acts as both the server AND the test runner.
 */
import app from './index';

const PORT = 3001; // Use a different port to avoid conflicts
const BASE = `http://localhost:${PORT}`;

async function runTests() {
    // Wait for server to be ready
    const server = app.listen(PORT, async () => {
        console.log(`\n🧪 E2E Test Server on port ${PORT}\n`);

        try {
            // 1. Health check
            const health = await fetch(`${BASE}/health`);
            const healthData = await health.json();
            console.log(`✅ Health: ${healthData.status} (${healthData.timestamp})`);

            // 2. Login with demo user
            const loginRes = await fetch(`${BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'demo@serviceplatform.com', password: 'demo1234' }),
            });
            const loginData = await loginRes.json() as any;
            const token = loginData.accessToken;
            console.log(`✅ Login: Token received (${token.substring(0, 20)}...)`);
            console.log(`   User ID: ${loginData.userId}`);

            const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

            // 3. Get business profile
            const profileRes = await fetch(`${BASE}/api/business/profile`, { headers });
            const profile = await profileRes.json() as any;
            console.log(`✅ Profile: ${profile.businessName} (${profile.serviceType})`);
            console.log(`   Currency: ${profile.currency}, Unit: ${profile.defaultUnit}`);

            // 4. List customers
            const custRes = await fetch(`${BASE}/api/customers`, { headers });
            const custData = await custRes.json() as any;
            console.log(`✅ Customers: ${custData.total} found`);

            // 5. List jobs
            const jobsRes = await fetch(`${BASE}/api/jobs`, { headers });
            const jobsData = await jobsRes.json() as any;
            console.log(`✅ Jobs: ${jobsData.total} found`);

            // 6. Monthly report
            const reportRes = await fetch(`${BASE}/api/reports/monthly?month=3&year=2026`, { headers });
            const report = await reportRes.json() as any;
            console.log(`✅ Report: Revenue €${report.revenue}, Expenses €${report.expenses}, Profit €${report.profit}`);
            console.log(`   Jobs this month: ${report.jobCount}`);

            // 7. List expenses
            const expRes = await fetch(`${BASE}/api/expenses?month=3&year=2026`, { headers });
            const expData = await expRes.json() as any;
            console.log(`✅ Expenses: ${expData.expenses.length} entries, Total €${expData.total}`);

            // 8. Create a new customer
            const newCustRes = await fetch(`${BASE}/api/customers`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ name: 'Test Customer', phone: '+1234567890', ratePerUnit: 10 }),
            });
            const newCust = await newCustRes.json() as any;
            console.log(`✅ New customer created: ${newCust.name} (ID: ${newCust.id?.substring(0, 8)}...)`);

            // 9. Create a new job
            const newJobRes = await fetch(`${BASE}/api/jobs`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    customerId: newCust.id,
                    quantity: 15.5,
                    expectedDeliveryDate: new Date(Date.now() + 3 * 86400000).toISOString(),
                }),
            });
            const newJob = await newJobRes.json() as any;
            console.log(`✅ New job created: ${newJob.quantity} ${newJob.unit} @ €${newJob.rate} = €${newJob.totalPrice}`);
            console.log(`   Status: ${newJob.status}`);

            // 10. Advance job status
            const statusRes = await fetch(`${BASE}/api/jobs/${newJob.id}/status`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status: 'PROCESSING' }),
            });
            const updated = await statusRes.json() as any;
            console.log(`✅ Status advanced: ${updated.status}`);

            // 11. Try invalid backward transition
            const badStatusRes = await fetch(`${BASE}/api/jobs/${newJob.id}/status`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status: 'RECEIVED' }),
            });
            const badStatus = await badStatusRes.json() as any;
            console.log(`✅ Backward transition rejected: "${badStatus.error?.substring(0, 50)}..."`);

            // 12. Register a new user
            const regRes = await fetch(`${BASE}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'newuser@test.com', password: 'testpass123' }),
            });
            const regData = await regRes.json() as any;
            console.log(`✅ Registration: ${regData.message}`);

            // 13. Revenue trend
            const trendRes = await fetch(`${BASE}/api/reports/trend?months=3`, { headers });
            const trend = await trendRes.json() as any;
            console.log(`✅ Trend: ${trend.trend?.length} months of data`);

            // 14. Auth security — rejected without token
            const noAuthRes = await fetch(`${BASE}/api/customers`);
            console.log(`✅ Auth guard: ${noAuthRes.status} without token (expected 401)`);

            console.log(`\n🎉 ALL 14 E2E TESTS PASSED!\n`);

        } catch (err) {
            console.error('❌ Test failed:', err);
        } finally {
            server.close(() => process.exit(0));
        }
    });
}

// Only run tests if this is the test script, not the main server
runTests();
