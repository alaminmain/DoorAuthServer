import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('\n=== DATABASE VERIFICATION ===\n');

    // Check Tenants
    const tenants = await prisma.tenant.findMany();
    console.log('📊 Tenants:', tenants.length);
    tenants.forEach(t => console.log(`  - ${t.name} (${t.domain})`));

    // Check Users
    const users = await prisma.user.findMany({
        include: {
            roles: {
                include: {
                    role: true
                }
            }
        }
    });
    console.log('\n👤 Users:', users.length);
    users.forEach(u => {
        const roles = u.roles.map(r => r.role.name).join(', ');
        console.log(`  - ${u.email} (${roles})`);
    });

    // Check Applications
    const apps = await prisma.application.findMany();
    console.log('\n📱 Applications:', apps.length);
    apps.forEach(a => {
        console.log(`  - ${a.name}`);
        console.log(`    Client ID: ${a.clientId}`);
        console.log(`    Redirect URI: ${a.redirectUris}`);
        console.log(`    Status: ${a.status}`);
    });

    // Check Roles
    const roles = await prisma.role.findMany();
    console.log('\n🔐 Roles:', roles.length);
    roles.forEach(r => console.log(`  - ${r.name} (${r.description})`));

    console.log('\n=== VERIFICATION COMPLETE ===\n');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
