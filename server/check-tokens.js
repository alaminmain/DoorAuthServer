const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTokens() {
    const tokens = await prisma.passToken.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
            user: {
                select: {
                    email: true,
                    userName: true
                }
            }
        }
    });

    console.log('\n📋 Recent Password Reset Tokens:\n');

    if (tokens.length === 0) {
        console.log('   No tokens found in database');
    } else {
        tokens.forEach((token, index) => {
            console.log(`${index + 1}. ${token.remarks || 'Password Reset'}`);
            console.log(`   User: ${token.user.userName || token.user.email}`);
            console.log(`   Status: ${token.isActive ? '✅ Active' : '❌ Inactive'}`);
            console.log(`   Expires: ${token.expireDate.toLocaleString()}`);
            console.log(`   Used: ${token.tokenUsedDate ? token.tokenUsedDate.toLocaleString() : 'Not yet'}`);
            console.log('');
        });
    }

    await prisma.$disconnect();
}

checkTokens().catch(console.error);
