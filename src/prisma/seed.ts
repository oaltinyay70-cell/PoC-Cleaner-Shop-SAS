import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Database seed script.
 * Creates a demo business owner with sample customers, jobs, and expenses.
 */
async function seed() {
    console.log('🌱 Seeding database...');

    // --- Demo user (password: "demo1234") ---
    const passwordHash = await bcrypt.hash('demo1234', 12);
    const user = await prisma.user.upsert({
        where: { email: 'demo@serviceplatform.com' },
        update: {},
        create: {
            email: 'demo@serviceplatform.com',
            passwordHash,
            emailVerified: true,
            businessName: 'Clean & Fresh Carpet Services',
            serviceType: 'Carpet Cleaning',
            currency: 'EUR',
            defaultUnit: 'm²',
            followupDays: 30,
        },
    });
    console.log(`  ✅ User: ${user.email} (password: demo1234)`);

    // --- Default message templates ---
    const templates = [
        { name: 'Job Received', body: 'Hello [customer_name], your order has been received. Expected delivery: [date].', isSystem: true },
        { name: 'Job Delivered', body: 'Hello [customer_name], your order is ready for pickup. Total: €[amount].', isSystem: true },
        { name: 'Follow-up', body: "Hi [customer_name], it's been a while since your last visit. We'd love to see you again!", isSystem: true },
    ];
    for (const t of templates) {
        await prisma.messageTemplate.upsert({
            where: { id: `system-${t.name.toLowerCase().replace(/\s/g, '-')}` },
            update: {},
            create: { id: `system-${t.name.toLowerCase().replace(/\s/g, '-')}`, businessId: user.id, ...t },
        });
    }
    console.log(`  ✅ Templates: ${templates.length} system templates`);

    // --- Sample customers ---
    const customersData = [
        { name: 'Alice Müller', phone: '+49 170 1234567', email: 'alice@example.com', ratePerUnit: 8.50, preferredChannel: 'WHATSAPP' as const },
        { name: 'Bob Schmidt', phone: '+49 171 2345678', email: 'bob@example.com', ratePerUnit: 7.00, preferredChannel: 'SMS' as const },
        { name: 'Clara Fischer', phone: '+49 172 3456789', ratePerUnit: 9.00, preferredChannel: 'VIBER' as const },
        { name: 'Dieter Wagner', phone: '+49 173 4567890', ratePerUnit: 6.50, preferredChannel: 'NONE' as const },
        { name: 'Eva Becker', phone: '+49 174 5678901', email: 'eva@example.com', ratePerUnit: 8.00, preferredChannel: 'WHATSAPP' as const },
    ];

    const customers = [];
    for (const c of customersData) {
        const customer = await prisma.customer.create({
            data: { businessId: user.id, ...c },
        });
        customers.push(customer);
    }
    console.log(`  ✅ Customers: ${customers.length} sample customers`);

    // --- Sample jobs with varying statuses ---
    const jobsData = [
        { customer: 0, quantity: 25.5, daysAgo: 15, status: 'DELIVERED' as const },
        { customer: 1, quantity: 12.0, daysAgo: 10, status: 'COMPLETED' as const },
        { customer: 2, quantity: 30.0, daysAgo: 5, status: 'PROCESSING' as const },
        { customer: 3, quantity: 8.5, daysAgo: 2, status: 'RECEIVED' as const },
        { customer: 0, quantity: 18.0, daysAgo: 1, status: 'RECEIVED' as const },
        { customer: 4, quantity: 40.0, daysAgo: 45, status: 'DELIVERED' as const }, // Due for follow-up
    ];

    for (const j of jobsData) {
        const customer = customers[j.customer];
        const rate = Number(customer.ratePerUnit || 0);
        const totalPrice = Math.floor(j.quantity * rate * 100) / 100;
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - j.daysAgo);
        const deliveryDate = new Date(createdAt);
        deliveryDate.setDate(deliveryDate.getDate() + 3);

        await prisma.job.create({
            data: {
                businessId: user.id,
                customerId: customer.id,
                quantity: j.quantity,
                unit: 'm²',
                rate,
                totalPrice,
                status: j.status,
                expectedDeliveryDate: deliveryDate,
                createdAt,
                receivedAt: createdAt,
                ...(j.status !== 'RECEIVED' && { processingAt: new Date(createdAt.getTime() + 86400000) }),
                ...(j.status === 'COMPLETED' || j.status === 'DELIVERED' ? { completedAt: new Date(createdAt.getTime() + 172800000) } : {}),
                ...(j.status === 'DELIVERED' ? { deliveredAt: deliveryDate, actualDeliveryDate: deliveryDate } : {}),
            },
        });
    }
    console.log(`  ✅ Jobs: ${jobsData.length} sample jobs`);

    // --- Sample expenses ---
    const expensesData = [
        { amount: 150.00, category: 'SUPPLIES' as const, description: 'Cleaning chemicals', daysAgo: 20 },
        { amount: 45.00, category: 'FUEL' as const, description: 'Delivery van fuel', daysAgo: 15 },
        { amount: 800.00, category: 'RENT' as const, description: 'Workshop rent March', daysAgo: 5 },
        { amount: 35.00, category: 'MARKETING' as const, description: 'Google Ads', daysAgo: 3 },
        { amount: 120.00, category: 'UTILITIES' as const, description: 'Water + electricity', daysAgo: 1 },
    ];

    for (const e of expensesData) {
        const date = new Date();
        date.setDate(date.getDate() - e.daysAgo);
        await prisma.expense.create({
            data: {
                businessId: user.id,
                amount: e.amount,
                category: e.category,
                description: e.description,
                date,
            },
        });
    }
    console.log(`  ✅ Expenses: ${expensesData.length} sample expenses`);

    console.log('\n🎉 Seed complete! Login with:');
    console.log('   Email: demo@serviceplatform.com');
    console.log('   Password: demo1234');
}

seed()
    .catch((err) => {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
