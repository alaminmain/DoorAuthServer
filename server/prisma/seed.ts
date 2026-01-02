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
        update: {
            appUrl: 'https://localhost:3000',
        },
        create: {
            name: 'Admin Panel',
            description: 'The main administration interface',
            clientId: 'admin-panel-client-id',
            clientSecret: 'super-secret-key-change-me',
            redirectUris: 'https://localhost:5173/callback',
            appUrl: 'https://localhost:3000',
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

    // 5.1 Assign Vehicle User Role to Admin (For Dashboard Visibility)
    // IMPORTANT: Roles must be created before assignment. Moving this assignment to end of script if roles not yet created.
    // Instead, I'll allow the script to create roles first, then I'll add a block at the end to link Admin to these roles.


    // 6. Create Todo Client Application
    const todoApp = await prisma.application.upsert({
        where: { clientId: 'todo-app-client' },
        update: {
            appUrl: 'http://localhost:5175',
        },
        create: {
            name: 'Todo App',
            description: 'Sample Todo Client',
            clientId: 'todo-app-client',
            clientSecret: 'todo-secret-key',
            redirectUris: 'https://localhost:5175/callback',
            appUrl: 'http://localhost:5175',
            tenantId: demoTenant.id,
            status: 'active',
        },
    });

    console.log(`Created App: ${todoApp.name} (${todoApp.id})`);

    // 7. Create 'Todo User' Role for Todo App
    const todoUserRole = await prisma.role.upsert({
        where: {
            tenantId_name: {
                tenantId: demoTenant.id,
                name: 'Todo User',
            },
        },
        update: {},
        create: {
            name: 'Todo User',
            description: 'Standard user for Todo Application',
            isSystem: false,
            tenantId: demoTenant.id,
            applicationId: todoApp.id, // Linked to Todo App
        },
    });
    console.log(`Created Role: ${todoUserRole.name}`);

    // 8. Create a Standard User
    const standardUser = await prisma.user.upsert({
        where: {
            tenantId_email: {
                tenantId: demoTenant.id,
                email: 'user@demo.localhost',
            },
        },
        update: {},
        create: {
            email: 'user@demo.localhost',
            loginId: 'user@demo.localhost',
            userName: 'Standard User',
            passwordHash, // Same password: password123
            tenantId: demoTenant.id,
            isApproved: true,
            designation: 'Staff',
        },
    });
    console.log(`Created User: ${standardUser.email}`);

    // 9. Assign Todo User Role to Standard User
    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: standardUser.id,
                roleId: todoUserRole.id,
            },
        },
        update: {},
        create: {
            userId: standardUser.id,
            roleId: todoUserRole.id,
        },
    });
    console.log('Assigned Todo User Role to Standard User');

    // 10. Create Vehicle Management Web Application
    const vehicleApp = await prisma.application.upsert({
        where: { clientId: 'vehicle-management-web' },
        update: {
            appUrl: 'https://localhost:7231',
            redirectUris: 'https://localhost:7231/signin-oidc,https://localhost:7231/signout-callback-oidc,https://localhost:7140/signout-callback-oidc',
        },
        create: {
            name: 'Vehicle Management System',
            description: 'Vehicle Management Web Application',
            clientId: 'vehicle-management-web',
            clientSecret: 'vehicle-secret-key',
            redirectUris: 'https://localhost:7231/signin-oidc,https://localhost:7231/signout-callback-oidc,https://localhost:7140/signout-callback-oidc', // Comma separated if multiple
            appUrl: 'https://localhost:7231',
            tenantId: demoTenant.id,
            status: 'active',
        },
    });

    console.log(`Created App: ${vehicleApp.name} (${vehicleApp.id})`);

    // 11. Create 'Vehicle User' Role
    const vehicleUserRole = await prisma.role.upsert({
        where: {
            tenantId_name: {
                tenantId: demoTenant.id,
                name: 'Vehicle User',
            },
        },
        update: {},
        create: {
            name: 'Vehicle User',
            description: 'User for Vehicle Management System',
            isSystem: false,
            tenantId: demoTenant.id,
            applicationId: vehicleApp.id,
        },
    });
    console.log(`Created Role: ${vehicleUserRole.name}`);

    // 12. Assign Vehicle User Role to Standard User
    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: standardUser.id,
                roleId: vehicleUserRole.id,
            },
        },
        update: {},
        create: {
            userId: standardUser.id,
            roleId: vehicleUserRole.id,
        },
    });
    console.log('Assigned Vehicle User Role to Standard User');


    // 13. Create DoorAuthSample Application
    const sampleApp = await prisma.application.upsert({
        where: { clientId: 'door-auth-sample' },
        update: {
            redirectUris: 'https://localhost:7140/signin-oidc,https://localhost:7140/signout-callback-oidc',
        },
        create: {
            name: 'DoorAuth Sample App',
            description: 'Minimal dotnet sample',
            clientId: 'door-auth-sample',
            clientSecret: 'sample-secret-key',
            redirectUris: 'https://localhost:7140/signin-oidc,https://localhost:7140/signout-callback-oidc',
            tenantId: demoTenant.id,
            status: 'active',
        },
    });
    console.log(`Created App: ${sampleApp.name} (${sampleApp.id})`);

    // 14. Assign 'Sample User' Role (re-use Vehicle User role logic or just link it)
    // For simplicity, we just need the client to exist. The user 'user@demo.localhost' can login.

    // 15. Assign 'Vehicle User' role to Admin (So Admin can see it in Dashboard)
    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: adminUser.id,
                roleId: vehicleUserRole.id,
            },
        },
        update: {},
        create: {
            userId: adminUser.id,
            roleId: vehicleUserRole.id,
        },
    });
    console.log('Assigned Vehicle User Role to Admin User');

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
