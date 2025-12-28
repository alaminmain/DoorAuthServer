import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkApp() {
    const app = await prisma.application.findUnique({
        where: { clientId: 'vehicle-management-web' }
    });

    if (app) {
        console.log('Application found:');
        console.log('- Client ID:', app.clientId);
        console.log('- Client Secret:', app.clientSecret);
        console.log('- Client Secret Length:', app.clientSecret?.length);
        console.log('- Redirect URIs:', app.redirectUris);
        console.log('- Status:', app.status);
    } else {
        console.log('Application NOT found!');
    }

    await prisma.$disconnect();
}

checkApp();
