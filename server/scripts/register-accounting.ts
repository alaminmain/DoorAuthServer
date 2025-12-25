import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.log('No tenant found. Please migrate/seed DB first.');
        return;
    }

    const appName = 'Accounting App';
    const clientId = 'accounting-app-client';

    const existingApp = await prisma.application.findUnique({
        where: { clientId }
    });

    if (existingApp) {
        console.log('App already exists:', existingApp.clientId);
    } else {
        const app = await prisma.application.create({
            data: {
                tenantId: tenant.id,
                name: appName,
                description: 'Financial Management System',
                clientId: clientId,
                clientSecret: 'accounting-secret-key', // Use a strong secret in production
                redirectUris: 'http://localhost:5176/callback', // Change port as needed
                status: 'active'
            }
        });
        console.log('App Created:', app.clientId);
        console.log('Client ID:', app.clientId);
        console.log('Client Secret:', 'accounting-secret-key');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
