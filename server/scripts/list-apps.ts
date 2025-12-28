import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function listApps() {
    const apps = await prisma.application.findMany();
    let output = '\nCurrent Applications:\n' + '='.repeat(80) + '\n';
    apps.forEach(app => {
        output += `Name: ${app.name}\n`;
        output += `Client ID: ${app.clientId}\n`;
        output += `Redirect URIs: ${app.redirectUris}\n`;
        output += '-'.repeat(80) + '\n';
    });

    console.log(output);
    fs.writeFileSync('apps-list.txt', output);
    console.log('\n✅ Output saved to apps-list.txt');

    await prisma.$disconnect();
}

listApps();
