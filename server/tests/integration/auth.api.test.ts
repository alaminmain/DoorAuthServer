import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import authRoutes from '../../src/routes/auth.routes';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

const prisma = new PrismaClient();

describe('Auth API - Integration Tests', () => {
    let testTenantId: string;
    let testUserId: string;
    let authToken: string;

    // Setup test data
    beforeAll(async () => {
        // Create test tenant
        const tenant = await prisma.tenant.create({
            data: {
                name: 'Test Tenant',
                domain: 'test-integration.localhost',
            },
        });
        testTenantId = tenant.id;
    });

    // Cleanup test data
    afterAll(async () => {
        // Clean up in reverse order of dependencies
        if (testUserId) {
            await prisma.user.deleteMany({
                where: { id: testUserId },
            });
        }
        if (testTenantId) {
            await prisma.tenant.delete({
                where: { id: testTenantId },
            });
        }
        await prisma.$disconnect();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'integration-test@example.com',
                    password: 'TestPassword123!',
                    userName: 'Integration Test User',
                    tenantId: testTenantId,
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.user.email).toBe('integration-test@example.com');

            // Save for cleanup
            testUserId = response.body.data.user.id;
            authToken = response.body.data.token;
        });

        it('should return 400 if user already exists', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'integration-test@example.com',
                    password: 'TestPassword123!',
                    userName: 'Duplicate User',
                    tenantId: testTenantId,
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already exists');
        });

        it('should return 400 if required fields are missing', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    // Missing password
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'integration-test@example.com',
                    password: 'TestPassword123!',
                    tenantId: testTenantId,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.user.email).toBe('integration-test@example.com');
        });

        it('should return 401 with invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'integration-test@example.com',
                    password: 'WrongPassword123!',
                    tenantId: testTenantId,
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid credentials');
        });

        it('should return 401 with non-existent email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'TestPassword123!',
                    tenantId: testTenantId,
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should lock account after 5 failed attempts', async () => {
            // Create a new user for this test
            const testUser = await prisma.user.create({
                data: {
                    email: 'locktest@example.com',
                    loginId: 'locktest',
                    passwordHash: await require('bcrypt').hash('CorrectPassword', 10),
                    userName: 'Lock Test User',
                    tenantId: testTenantId,
                },
            });

            // Attempt 5 failed logins
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: 'locktest@example.com',
                        password: 'WrongPassword',
                        tenantId: testTenantId,
                    });
            }

            // 6th attempt should return account locked
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'locktest@example.com',
                    password: 'WrongPassword',
                    tenantId: testTenantId,
                })
                .expect(403);

            expect(response.body.message).toContain('locked');

            // Cleanup
            await prisma.user.delete({ where: { id: testUser.id } });
        });
    });
});
