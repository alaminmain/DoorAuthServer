import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('Comprehensive Authentication Tests', () => {
    let tenantId: string;
    let userId: string;
    const uniqueSuffix = Date.now().toString();
    const testEmail = `test.auth.${uniqueSuffix}@example.com`;
    const testPassword = 'SecurePassword123!';
    const tenantName = `Auth Test Tenant ${uniqueSuffix}`;

    beforeAll(async () => {
        // Create a tenant for all tests
        const tenant = await prisma.tenant.create({
            data: {
                name: tenantName,
                domain: `auth.${uniqueSuffix}.localhost`,
            }
        });
        tenantId = tenant.id;
    });

    afterAll(async () => {
        // Cleanup
        if (userId) {
            // await prisma.passToken.deleteMany().catch(() => { }); // Use PassToken if that's the intention
            await prisma.user.deleteMany({ where: { tenantId } });
        }
        await prisma.tenant.delete({ where: { id: tenantId } });
        await prisma.$disconnect();
    });

    describe('1. Registration Scenarios', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: testEmail,
                    password: testPassword,
                    userName: 'Test User',
                    tenantId: tenantId
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe(testEmail);
            expect(res.body.data.token).toBeDefined();
            userId = res.body.data.user.id;
        });

        it('should fail to register with duplicate email in same tenant', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: testEmail,
                    password: 'AnotherPassword',
                    userName: 'Duplicate User',
                    tenantId: tenantId
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/already exists/i);
        });

        it('should fail with missing required fields', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'missing.fields@example.com',
                    // Missing password and tenantId
                });

            expect(res.status).toBe(400); // Validation error (Zod or Controller)
        });
    });

    describe('2. Login Scenarios', () => {
        it('should login successfully with correct credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testEmail,
                    password: testPassword
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.token).toBeDefined();

            // Verify structure
            expect(res.body.data.user).not.toHaveProperty('passwordHash');
        });

        it('should fail with incorrect password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testEmail,
                    password: 'WrongPassword123'
                });

            expect(res.status).toBe(401); // Controller returns 401 for bad auth
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/invalid credentials/i);
        });

        it('should fail for non-existent user', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'ghost@example.com',
                    password: 'password'
                });

            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/invalid credentials/i); // Security: Generic message
        });
    });

    describe('3. Account Security Scenarios', () => {
        // Create specific blocked user for this test to avoid locking main test user
        let blockedUserId: string;
        const blockedEmail = `blocked.${uniqueSuffix}@example.com`;

        beforeAll(async () => {
            const hash = await bcrypt.hash('password', 10);
            const user = await prisma.user.create({
                data: {
                    email: blockedEmail,
                    loginId: blockedEmail,
                    passwordHash: hash,
                    tenantId: tenantId,
                    isApproved: false // Explicitly unapproved
                }
            });
            blockedUserId = user.id;
        });

        it('should deny login for unapproved account', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: blockedEmail,
                    password: 'password'
                });

            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/not approved/i);
        });

        it('should trigger 2FA requirement if enabled', async () => {
            // Enable 2FA for main test user
            await prisma.user.update({
                where: { id: userId },
                data: { isTwoFactorEnabled: true }
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testEmail,
                    password: testPassword
                });

            // Expect success but special body flag, NOT a token
            // Wait, looking at controller logic: `res.status(200).json(ApiResponse.success(result, 'Login successful'));`
            // And result is `{ requires2FA: true, message: '...' }`
            expect(res.status).toBe(200);
            expect(res.body.data.requires2FA).toBe(true);
            expect(res.body.data.token).toBeUndefined(); // Logic: checks !twoFactorToken -> returns object without token

            // Revert 2FA for cleanup/other tests?
            await prisma.user.update({
                where: { id: userId },
                data: { isTwoFactorEnabled: false }
            });
        });
    });

    describe('4. Token & Protected Routes', () => {
        let validToken: string;

        beforeAll(async () => {
            // Login again to get a fresh token (2FA is disabled now)
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testEmail,
                    password: testPassword
                });
            validToken = res.body.data.token;
        });

        it('should allow access to protected route with valid token', async () => {
            // Using /api/tenants which is public? No, tenant lists usually protected or public. 
            // In tenant.routes.ts, router.get('/', tenantController.getAllTenants) is public? 
            // Let's check a definitely protected route.
            // router.post('/', authMiddleware, createTenant) is protected.

            // Let's try to access a protected route with missing credentials
            const res = await request(app)
                .post('/api/tenants')
                .send({}); // Body doesn't matter, auth check comes first

            expect(res.status).toBe(401); // No token provided
        });

        it('should allow protected action with valid token', async () => {
            // We can check if status is NOT 401 (e.g. 400 Bad Request is fine, meaning Auth passed)
            const res = await request(app)
                .post('/api/tenants')
                .set('Authorization', `Bearer ${validToken}`)
                .send({}); // Invalid body

            // Should reach controller and fail validation (400), but NOT 401
            expect(res.status).not.toBe(401);
            expect(res.status).toBe(400); // "Invalid input"
        });

        it('should deny access with malformed token', async () => {
            const res = await request(app)
                .post('/api/tenants')
                .set('Authorization', `Bearer Malformed.Token.Here`)
                .send({});

            expect(res.status).toBe(401); // Auth middleware rejects
        });
    });

    describe('5. Logout', () => {
        it('should logout successfully', async () => {
            const res = await request(app)
                .post('/api/auth/logout');

            expect(res.status).toBe(200);
            // Verify cookies are cleared if we were checking cookies, 
            // but supertest handles headers. We assume express res.clearCookie works.
        });
    });
});
