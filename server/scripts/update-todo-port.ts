import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const app = await prisma.application.findUnique({
        where: { clientId: 'todo-app-client' }
    });

    if (app) {
        await prisma.application.update({
            where: { clientId: 'todo-app-client' },
            data: {
                redirectUris: 'http://localhost:5175/callback'
            }
        });
        console.log('Updated redirect URI to port 5175');
    } else {
        console.log('App not found');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
