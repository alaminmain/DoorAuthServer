/**
 * Script to clean up duplicate Vehicle Management System menus
 * 
 * Usage: npx ts-node scripts/clean-vehicle-menus.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const APPLICATION_CLIENT_ID = 'vehicle-management-web';

async function main() {
    console.log('🧹 Starting Vehicle Management Menu Cleanup...\n');

    try {
        // Find the application
        const application = await prisma.application.findUnique({
            where: { clientId: APPLICATION_CLIENT_ID }
        });

        if (!application) {
            console.error(`❌ Application with clientId '${APPLICATION_CLIENT_ID}' not found!`);
            return;
        }

        console.log(`✓ Found application: ${application.name} (${application.id})\n`);

        // Get all menus for this application
        const existingMenus = await prisma.menu.findMany({
            where: { applicationId: application.id },
            orderBy: [{ order: 'asc' }, { label: 'asc' }]
        });

        console.log(`📋 Found ${existingMenus.length} menu items:\n`);
        existingMenus.forEach((menu, index) => {
            console.log(`${index + 1}. ${menu.label} (${menu.path}) - Order: ${menu.order}`);
        });

        if (existingMenus.length === 0) {
            console.log('\n✓ No menus to clean up.');
            return;
        }

        // Delete all menus
        console.log(`\n🗑️  Deleting ${existingMenus.length} menu items...`);

        const result = await prisma.menu.deleteMany({
            where: { applicationId: application.id }
        });

        console.log(`\n✅ Successfully deleted ${result.count} menu items!`);
        console.log('\n💡 You can now run the insert script to add fresh menus:');
        console.log('   npx ts-node scripts/insert-vehicle-menus.ts\n');

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
    }
}

main()
    .catch((e) => {
        console.error(e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
