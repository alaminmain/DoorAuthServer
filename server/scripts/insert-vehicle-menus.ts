/**
 * Script to insert Vehicle Management System menus into DoorAuth
 * 
 * Usage:
 * 1. Update the APPLICATION_ID constant with your Vehicle Management app ID
 * 2. Run: npx ts-node scripts/insert-vehicle-menus.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// CONFIGURATION: Update this with your actual Vehicle Management Application ID
const APPLICATION_ID = 'vehicle-management-web'; // This is the clientId

interface MenuItemData {
    label: string;
    path: string;
    icon: string;
    order: number;
    requiredPermission: string | null;
    parentId?: string | null;
}

const vehicleManagementMenus: MenuItemData[] = [
    {
        label: 'Dashboard',
        path: '/dashboard',
        icon: 'dashboard',
        order: 1,
        requiredPermission: 'dashboard:read',
        parentId: null
    },
    {
        label: 'Vehicles',
        path: '/vehicles',
        icon: 'directions_car',
        order: 2,
        requiredPermission: 'vehicles:read',
        parentId: null
    },
    {
        label: 'Drivers',
        path: '/drivers',
        icon: 'person',
        order: 3,
        requiredPermission: 'drivers:read',
        parentId: null
    },
    {
        label: 'Bookings',
        path: '/bookings',
        icon: 'book_online',
        order: 4,
        requiredPermission: 'bookings:read',
        parentId: null
    },
    {
        label: 'Customers',
        path: '/customers',
        icon: 'people',
        order: 5,
        requiredPermission: 'customers:read',
        parentId: null
    },
    {
        label: 'Legal Cases',
        path: '/legalcases',
        icon: 'gavel',
        order: 6,
        requiredPermission: 'legalcases:read',
        parentId: null
    },
    {
        label: 'Maintenance',
        path: '/maintenance',
        icon: 'build',
        order: 7,
        requiredPermission: 'maintenance:read',
        parentId: null
    },
    {
        label: 'Settings',
        path: '/settings',
        icon: 'settings',
        order: 8,
        requiredPermission: 'settings:read',
        parentId: null
    },
    {
        label: 'Tenants',
        path: '/tenants',
        icon: 'business',
        order: 9,
        requiredPermission: 'tenants:read',
        parentId: null
    }
];

async function main() {
    console.log('🚀 Starting Vehicle Management Menu Insertion...\n');

    try {
        // 1. Find the application by clientId
        const application = await prisma.application.findUnique({
            where: { clientId: APPLICATION_ID }
        });

        if (!application) {
            console.error(`❌ Application with clientId '${APPLICATION_ID}' not found!`);
            console.log('\n💡 Available applications:');
            const apps = await prisma.application.findMany({
                select: { id: true, name: true, clientId: true }
            });
            apps.forEach(app => {
                console.log(`   - ${app.name} (clientId: ${app.clientId}, id: ${app.id})`);
            });
            return; // Exit instead of process.exit
        }

        console.log(`✓ Found application: ${application.name} (${application.id})\n`);

        // 2. Check if menus already exist
        const existingMenus = await prisma.menu.findMany({
            where: { applicationId: application.id }
        });

        if (existingMenus.length > 0) {
            console.log(`⚠️  Warning: ${existingMenus.length} menu(s) already exist for this application:`);
            existingMenus.forEach(menu => {
                console.log(`   - ${menu.label} (${menu.path})`);
            });
            console.log('\n❓ Do you want to continue? This will create additional menus.');
            console.log('   To delete existing menus, use the Menus page in the admin panel.\n');
        }

        // 3. Insert menus
        let successCount = 0;
        let errorCount = 0;

        for (const menuData of vehicleManagementMenus) {
            try {
                const menu = await prisma.menu.create({
                    data: {
                        label: menuData.label,
                        path: menuData.path,
                        icon: menuData.icon,
                        order: menuData.order,
                        requiredPermission: menuData.requiredPermission,
                        applicationId: application.id,
                        parentId: menuData.parentId
                    }
                });

                console.log(`✓ Created: ${menu.label} (${menu.path})`);
                successCount++;
            } catch (error: any) {
                console.error(`✗ Failed to create ${menuData.label}: ${error.message}`);
                errorCount++;
            }
        }

        // 4. Summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 SUMMARY');
        console.log('='.repeat(50));
        console.log(`✓ Successfully created: ${successCount} menus`);
        if (errorCount > 0) {
            console.log(`✗ Failed: ${errorCount} menus`);
        }
        console.log('='.repeat(50));

        // 5. Display final menu structure
        console.log('\n📋 Final Menu Structure:');
        const allMenus = await prisma.menu.findMany({
            where: { applicationId: application.id },
            orderBy: [{ order: 'asc' }, { label: 'asc' }]
        });

        allMenus.forEach((menu, index) => {
            console.log(`${index + 1}. ${menu.label} (${menu.path}) - Permission: ${menu.requiredPermission || 'None'}`);
        });

        console.log('\n✅ Menu insertion completed successfully!');
        console.log(`\n💡 You can now view these menus in the Vehicle Management System.`);
        console.log(`   Login with a user that has the appropriate permissions.\n`);

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
