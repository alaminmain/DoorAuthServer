import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import routes from '../../src/routes';

const app = express();
app.use(express.json());
app.use('/api', routes);

const prisma = new PrismaClient();

describe('E2E Tests - Complete User Journey', () => {
    let tenantId: string;
    let userId: string;
    let authToken: string;
    let applicationId: string;
    let roleId: string;

    beforeAll(async () => {
        // Create test tenant
        const tenant = await prisma.tenant.create({
            data: {
                name: 'E2E Test Tenant',
                domain: 'e2e-test.localhost',
            },
        });
        tenantId = tenant.id;
    });

    afterAll(async () => {
        // Cleanup in reverse order
        if (roleId) await prisma.role.deleteMany({ where: { id: roleId } });
        if (applicationId) await prisma.application.deleteMany({ where: { id: applicationId } });
        if (userId) await prisma.user.deleteMany({ where: { id: userId } });
        if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } });
        await prisma.$disconnect();
    });

    describe('Complete User Journey', () => {
        it('1. Should register a new user', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'e2e-user@example.com',
                    password: 'SecurePassword123!',
                    userName: 'E2E Test User',
                    tenantId,
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            userId = response.body.data.user.id;
            authToken = response.body.data.token;
        });

        it('2. Should login with registered credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'e2e-user@example.com',
                    password: 'SecurePassword123!',
                    tenantId,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            authToken = response.body.data.token;
        });

        it('3. Should create an application', async () => {
            const response = await request(app)
                .post('/api/applications')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'E2E Test App',
                    redirectUris: 'http://localhost:5173/callback',
                    tenantId,
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('clientId');
            expect(response.body.data).toHaveProperty('clientSecret');
            applicationId = response.body.data.id;
        });

        it('4. Should create a role', async () => {
            const response = await request(app)
                .post('/api/roles')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'E2E Test Role',
                    description: 'Role for E2E testing',
                    tenantId,
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            roleId = response.body.data.id;
        });

        it('5. Should add permission to role', async () => {
            const response = await request(app)
                .post(`/api/roles/${roleId}/permissions`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    resource: 'users',
                    action: 'create',
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.resource).toBe('users');
            expect(response.body.data.action).toBe('create');
        });

        it('6. Should get account status', async () => {
            const response = await request(app)
                .get('/api/account/status')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe('e2e-user@example.com');
            expect(response.body.data.isLocked).toBe(false);
        });

        it('7. Should fail without authentication', async () => {
            await request(app)
                .get('/api/account/status')
                .expect(401);
        });

        it('8. Should fail with invalid token', async () => {
            await request(app)
                .get('/api/account/status')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });
});
