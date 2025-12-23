import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Setup before all tests
beforeAll(async () => {
    // You can add global setup here
    console.log('🧪 Test suite starting...');
});

// Cleanup after all tests
afterAll(async () => {
    await prisma.$disconnect();
    console.log('✅ Test suite completed');
});

// Clear database before each test (optional)
beforeEach(async () => {
    // Uncomment to clear database before each test
    // await prisma.user.deleteMany();
    // await prisma.tenant.deleteMany();
    // etc.
});
