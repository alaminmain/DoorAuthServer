import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateToHttps() {
    console.log('Updating redirect URIs to HTTPS...');

    try {
        // Fetch all applications with http://localhost and update them
        const appsToUpdate = await prisma.application.findMany({
            where: {
                redirectUris: {
                    contains: 'http://localhost',
                },
            },
        });

        console.log(`Found ${appsToUpdate.length} applications to update`);

        for (const app of appsToUpdate) {
            const updatedUris = app.redirectUris.replace(/http:\/\/localhost/g, 'https://localhost');
            await prisma.application.update({
                where: { id: app.id },
                data: { redirectUris: updatedUris },
            });
            console.log(`✅ Updated ${app.name}:`);
            console.log(`   From: ${app.redirectUris}`);
            console.log(`   To:   ${updatedUris}`);
        }

        if (appsToUpdate.length === 0) {
            console.log('✅ No applications need updating - all are already using HTTPS!');
        } else {
            console.log(`\n✅ Successfully updated ${appsToUpdate.length} application(s) to HTTPS!`);
        }
    } catch (error) {
        console.error('❌ Error updating redirect URIs:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

updateToHttps()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
