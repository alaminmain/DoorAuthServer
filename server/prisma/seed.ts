import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // 1. Create a Default Tenant
    const demoTenant = await prisma.tenant.upsert({
        where: { domain: 'demo.localhost' },
        update: {},
        create: {
            name: 'Demo Corp',
            domain: 'demo.localhost',
            brandingConfig: JSON.stringify({
                primaryColor: '#1976d2',
                logoUrl: 'https://via.placeholder.com/150',
            }),
        },
    });

    console.log(`Created Tenant: ${demoTenant.name} (${demoTenant.id})`);

    // 2. Create System Admin Role for this Tenant
    const adminRole = await prisma.role.upsert({
        where: {
            tenantId_name: {
                tenantId: demoTenant.id,
                name: 'Admin',
            },
        },
        update: {},
        create: {
            name: 'Admin',
            description: 'System Administrator with full access',
            isSystem: true,
            tenantId: demoTenant.id,
        },
    });

    console.log(`Created Role: ${adminRole.name} (${adminRole.id})`);

    // 3. Create a Default Application (e.g., The Admin Panel itself)
    const adminApp = await prisma.application.upsert({
        where: { clientId: 'admin-panel-client-id' },
        update: {},
        create: {
            name: 'Admin Panel',
            description: 'The main administration interface',
            clientId: 'admin-panel-client-id',
            clientSecret: 'super-secret-key-change-me', // In prod, hash this or manage securely
            redirectUris: 'http://localhost:5173/callback',
            tenantId: demoTenant.id,
        },
    });

    console.log(`Created App: ${adminApp.name} (${adminApp.id})`);

    // 4. Create a Default Admin User
    const bcrypt = require('bcrypt'); // Using require to avoid import issues in seed script if esModuleInterop varies
    const passwordHash = await bcrypt.hash('password123', 10);

    const adminUser = await prisma.user.upsert({
        where: {
            tenantId_email: {
                tenantId: demoTenant.id,
                email: 'admin@demo.localhost',
            },
        },
        update: {},
        create: {
            email: 'admin@demo.localhost',
            loginId: 'admin@demo.localhost',
            userName: 'Demo Admin',
            passwordHash,
            tenantId: demoTenant.id,
            isApproved: true,
            designation: 'System Administrator',
        },
    });

    console.log(`Created User: ${adminUser.email} (Password: password123)`);

    // 5. Assign Admin Role to User
    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: adminUser.id,
                roleId: adminRole.id,
            },
        },
        update: {},
        create: {
            userId: adminUser.id,
            roleId: adminRole.id,
        },
    });

    console.log('Assigned Admin Role to User');

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
