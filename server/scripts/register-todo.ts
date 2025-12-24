import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.log('No tenant found. Please migrate/seed DB first.');
        return;
    }

    const existingApp = await prisma.application.findUnique({
        where: { clientId: 'todo-app-client' }
    });

    if (existingApp) {
        console.log('App already exists:', existingApp.clientId);
    } else {
        const app = await prisma.application.create({
            data: {
                tenantId: tenant.id,
                name: 'Todo App',
                description: 'Sample Todo Client',
                clientId: 'todo-app-client',
                clientSecret: 'todo-secret-key',
                redirectUris: 'http://localhost:5175/callback',
                status: 'active'
            }
        });
        console.log('App Created:', app.clientId);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
