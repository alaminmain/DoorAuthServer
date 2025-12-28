import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateApp() {
    const result = await prisma.application.update({
        where: { clientId: 'vehicle-management-web' },
        data: {
            clientSecret: 'vehicle-secret-key'
        }
    });

    console.log('Application updated:');
    console.log('- Client ID:', result.clientId);
    console.log('- Client Secret:', result.clientSecret);
    console.log('✅ Client secret updated to: vehicle-secret-key');

    await prisma.$disconnect();
}

updateApp().catch(console.error);
