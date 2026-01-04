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

    // ========================================
    // 10. VEHICLE MANAGEMENT SYSTEM - RBAC SETUP
    // ========================================

    console.log('\n--- Setting up Vehicle Management System ---');

    // 10.1 Create Vehicle Management Web Application
    const vehicleApp = await prisma.application.upsert({
        where: { clientId: 'vehicle-management-web' },
        update: {
            appUrl: 'https://localhost:7231',
            redirectUris: 'https://localhost:7231/signin-oidc,https://localhost:7231/signout-callback-oidc,https://localhost:7140/signout-callback-oidc',
        },
        create: {
            name: 'Vehicle Management System',
            description: 'Comprehensive Fleet Management Application',
            clientId: 'vehicle-management-web',
            clientSecret: 'vehicle-secret-key',
            redirectUris: 'https://localhost:7231/signin-oidc,https://localhost:7231/signout-callback-oidc,https://localhost:7140/signout-callback-oidc',
            appUrl: 'https://localhost:7231',
            tenantId: demoTenant.id,
            status: 'active',
        },
    });
    console.log(`✓ Created App: ${vehicleApp.name} (${vehicleApp.id})`);

    // 10.2 Create 'Owner' Role (Full Access)
    const ownerRole = await prisma.role.upsert({
        where: {
            tenantId_name: {
                tenantId: demoTenant.id,
                name: 'Owner',
            },
        },
        update: {},
        create: {
            name: 'Owner',
            description: 'Full access to all Vehicle Management features',
            isSystem: false,
            tenantId: demoTenant.id,
            applicationId: vehicleApp.id,
        },
    });
    console.log(`✓ Created Role: ${ownerRole.name}`);

    // 10.3 Create 'ManagementStaff' Role (Limited Access)
    const managementStaffRole = await prisma.role.upsert({
        where: {
            tenantId_name: {
                tenantId: demoTenant.id,
                name: 'ManagementStaff',
            },
        },
        update: {},
        create: {
            name: 'ManagementStaff',
            description: 'Limited access to Drivers, Vehicles, and Bookings only',
            isSystem: false,
            tenantId: demoTenant.id,
            applicationId: vehicleApp.id,
        },
    });
    console.log(`✓ Created Role: ${managementStaffRole.name}`);

    // 10.4 Define Permissions for Owner Role (Full Access)
    const ownerPermissions = [
        { resource: 'dashboard', action: 'read' },
        { resource: 'vehicles', action: 'read' },
        { resource: 'vehicles', action: 'write' },
        { resource: 'drivers', action: 'read' },
        { resource: 'drivers', action: 'write' },
        { resource: 'bookings', action: 'read' },
        { resource: 'bookings', action: 'write' },
        { resource: 'customers', action: 'read' },
        { resource: 'customers', action: 'write' },
        { resource: 'legalcases', action: 'read' },
        { resource: 'legalcases', action: 'write' },
        { resource: 'maintenance', action: 'read' },
        { resource: 'maintenance', action: 'write' },
        { resource: 'settings', action: 'read' },
        { resource: 'settings', action: 'write' },
        { resource: 'tenants', action: 'read' },
        { resource: 'tenants', action: 'write' },
    ];

    for (const perm of ownerPermissions) {
        await prisma.permission.upsert({
            where: {
                roleId_resource_action: {
                    roleId: ownerRole.id,
                    resource: perm.resource,
                    action: perm.action,
                },
            },
            update: {},
            create: {
                roleId: ownerRole.id,
                resource: perm.resource,
                action: perm.action,
            },
        });
    }
    console.log(`✓ Created ${ownerPermissions.length} permissions for Owner role`);

    // 10.5 Define Permissions for ManagementStaff Role (Limited Access)
    const staffPermissions = [
        { resource: 'dashboard', action: 'read' },
        { resource: 'vehicles', action: 'read' },
        { resource: 'drivers', action: 'read' },
        { resource: 'bookings', action: 'read' },
        { resource: 'bookings', action: 'write' },
    ];

    for (const perm of staffPermissions) {
        await prisma.permission.upsert({
            where: {
                roleId_resource_action: {
                    roleId: managementStaffRole.id,
                    resource: perm.resource,
                    action: perm.action,
                },
            },
            update: {},
            create: {
                roleId: managementStaffRole.id,
                resource: perm.resource,
                action: perm.action,
            },
        });
    }
    console.log(`✓ Created ${staffPermissions.length} permissions for ManagementStaff role`);

    // 10.6 Create Menu Items for Vehicle Management System
    const menuItems = [
        { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', order: 1, requiredPermission: 'dashboard:read', parentId: null },
        { label: 'Vehicles', path: '/vehicles', icon: 'directions_car', order: 2, requiredPermission: 'vehicles:read', parentId: null },
        { label: 'Drivers', path: '/drivers', icon: 'person', order: 3, requiredPermission: 'drivers:read', parentId: null },
        { label: 'Bookings', path: '/bookings', icon: 'book_online', order: 4, requiredPermission: 'bookings:read', parentId: null },
        { label: 'Customers', path: '/customers', icon: 'people', order: 5, requiredPermission: 'customers:read', parentId: null },
        { label: 'Legal Cases', path: '/legalcases', icon: 'gavel', order: 6, requiredPermission: 'legalcases:read', parentId: null },
        { label: 'Maintenance', path: '/maintenance', icon: 'build', order: 7, requiredPermission: 'maintenance:read', parentId: null },
        { label: 'Settings', path: '/settings', icon: 'settings', order: 8, requiredPermission: 'settings:read', parentId: null },
        { label: 'Tenants', path: '/tenants', icon: 'business', order: 9, requiredPermission: 'tenants:read', parentId: null },
    ];

    for (const menu of menuItems) {
        await prisma.menu.upsert({
            where: {
                id: `${vehicleApp.id}-${menu.path}`,
            },
            update: {},
            create: {
                id: `${vehicleApp.id}-${menu.path}`,
                label: menu.label,
                path: menu.path,
                icon: menu.icon,
                order: menu.order,
                requiredPermission: menu.requiredPermission,
                applicationId: vehicleApp.id,
                parentId: menu.parentId,
            },
        });
    }
    console.log(`✓ Created ${menuItems.length} menu items for Vehicle Management`);

    // 10.7 Create Owner User
    const ownerUser = await prisma.user.upsert({
        where: {
            tenantId_email: {
                tenantId: demoTenant.id,
                email: 'owner@vehicle.com',
            },
        },
        update: {},
        create: {
            email: 'owner@vehicle.com',
            loginId: 'owner@vehicle.com',
            userName: 'Fleet Owner',
            passwordHash,
            tenantId: demoTenant.id,
            isApproved: true,
            designation: 'Owner & CEO',
            companyName: 'Premium Fleet Services',
        },
    });
    console.log(`✓ Created Owner User: ${ownerUser.email} (Password: password123)`);

    // 10.8 Assign Owner Role to Owner User
    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: ownerUser.id,
                roleId: ownerRole.id,
            },
        },
        update: {},
        create: {
            userId: ownerUser.id,
            roleId: ownerRole.id,
        },
    });
    console.log(`✓ Assigned Owner role to ${ownerUser.email}`);

    // 10.9 Create 5 ManagementStaff Users
    const staffUsers = [
        { email: 'staff1@vehicle.com', name: 'Ahmed Rahman', designation: 'Operations Manager' },
        { email: 'staff2@vehicle.com', name: 'Fatima Khan', designation: 'Fleet Coordinator' },
        { email: 'staff3@vehicle.com', name: 'Karim Hassan', designation: 'Booking Specialist' },
        { email: 'staff4@vehicle.com', name: 'Nadia Islam', designation: 'Customer Relations' },
        { email: 'staff5@vehicle.com', name: 'Tariq Ahmed', designation: 'Fleet Supervisor' },
    ];

    for (const staff of staffUsers) {
        const staffUser = await prisma.user.upsert({
            where: {
                tenantId_email: {
                    tenantId: demoTenant.id,
                    email: staff.email,
                },
            },
            update: {},
            create: {
                email: staff.email,
                loginId: staff.email,
                userName: staff.name,
                passwordHash,
                tenantId: demoTenant.id,
                isApproved: true,
                designation: staff.designation,
                companyName: 'Premium Fleet Services',
            },
        });

        // Assign ManagementStaff Role
        await prisma.userRole.upsert({
            where: {
                userId_roleId: {
                    userId: staffUser.id,
                    roleId: managementStaffRole.id,
                },
            },
            update: {},
            create: {
                userId: staffUser.id,
                roleId: managementStaffRole.id,
            },
        });

        console.log(`✓ Created Staff User: ${staffUser.email} with ManagementStaff role`);
    }

    console.log('\n✓ Vehicle Management System RBAC setup completed!');
    console.log(`  - 1 Owner user (full access)`);
    console.log(`  - 5 ManagementStaff users (limited access)`);
    console.log(`  - 2 Roles with granular permissions`);
    console.log(`  - 9 Menu items configured\n`);


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

    // 15. Assign 'Owner' role to Admin (So Admin can see Vehicle Management in Dashboard)
    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: adminUser.id,
                roleId: ownerRole.id,
            },
        },
        update: {},
        create: {
            userId: adminUser.id,
            roleId: ownerRole.id,
        },
    });
    console.log('✓ Assigned Owner role to Admin User for Vehicle Management access');


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
