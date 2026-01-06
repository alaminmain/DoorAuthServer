import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Integration Tests: Entity CRUD', () => {
    let tenantId: string;
    let userId: string;
    let token: string;
    let applicationId: string;
    let menuId: string;
    let roleId: string;

    const uniqueSuffix = Date.now().toString();
    const adminEmail = `admin.${uniqueSuffix}@test.com`;
    const adminPassword = 'password123';
    const tenantName = `Test Tenant ${uniqueSuffix}`;
    const tenantDomain = `test.${uniqueSuffix}.localhost`;

    beforeAll(async () => {
        // 1. Create a Tenant directly via Prisma (Bootstrap)
        const tenant = await prisma.tenant.create({
            data: {
                name: tenantName,
                domain: tenantDomain,
            }
        });
        tenantId = tenant.id;
        console.log('✅ Bootstrapped Tenant:', tenantId);
    });

    afterAll(async () => {
        // Cleanup
        // Deleting tenant cascades to users, apps, roles...
        if (tenantId) {
            // await prisma.tenant.delete({ where: { id: tenantId } }); 
            // We might want to keep data for inspection or rely on global teardown
        }
        await prisma.$disconnect();
    });

    describe('Auth System', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: adminEmail,
                    password: adminPassword,
                    userName: 'Test Admin',
                    tenantId: tenantId
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe(adminEmail);
            userId = res.body.data.user.id;
        });

        it('should login and return a token', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: adminEmail,
                    password: adminPassword,
                    tenantId: tenantId
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.token).toBeDefined();
            token = res.body.data.token;
        });
    });

    describe('Tenant Entity', () => {
        it('should get all tenants (public endpoint)', async () => {
            const res = await request(app).get('/api/tenants');
            expect(res.status).toBe(200);
            expect(res.body.data.length).toBeGreaterThan(0);
        });

        it('should create a new tenant (protected)', async () => {
            const newTenantName = `New Tenant ${uniqueSuffix}`;
            const res = await request(app)
                .post('/api/tenants')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: newTenantName,
                    domain: `new.${uniqueSuffix}.localhost`
                });

            expect(res.status).toBe(201);
            expect(res.body.data.name).toBe(newTenantName);
        });
    });

    describe('Application Entity', () => {
        it('should create an application', async () => {
            const res = await request(app)
                .post('/api/applications')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Test App',
                    description: 'Integration Test App',
                    tenantId: tenantId,
                    redirectUris: ['https://localhost:3000/callback']
                });

            expect(res.status).toBe(201);
            expect(res.body.data.clientId).toBeDefined();
            expect(res.body.data.clientSecret).toBeDefined(); // Secret explicitly returned on create
            applicationId = res.body.data.id;
        });

        it('should get applications', async () => {
            const res = await request(app)
                .get('/api/applications')
                .set('Authorization', `Bearer ${token}`)
                .query({ tenantId });

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            const created = res.body.data.find((a: any) => a.id === applicationId);
            expect(created).toBeDefined();
        });
    });

    describe('Menu Entity', () => {
        it('should create a menu', async () => {
            const res = await request(app)
                .post('/api/menus')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    applicationId: applicationId,
                    label: 'Dashboard',
                    path: '/dashboard',
                    icon: 'LayoutDashboard',
                    order: 0,
                    requiredPermission: 'dashboard.view',
                    parentId: '' // Testing the fix we implemented
                });

            expect(res.status).toBe(201);
            expect(res.body.data.label).toBe('Dashboard');
            expect(res.body.data.parentId).toBeNull();
            menuId = res.body.data.id;
        });

        it('should get menus for application', async () => {
            const res = await request(app)
                .get('/api/menus')
                .set('Authorization', `Bearer ${token}`)
                .query({ applicationId });

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            // It returns hierarchy
            const dashboard = res.body.data.find((m: any) => m.id === menuId);
            expect(dashboard).toBeDefined();
        });
    });

    describe('Role Entity', () => {
        it('should create a role with implicit permissions', async () => {
            const res = await request(app)
                .post('/api/roles')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Test Role',
                    tenantId: tenantId,
                    applicationId: applicationId,
                    permissionIds: ['dashboard.view:read', 'dashboard.view:write']
                });

            expect(res.status).toBe(201);
            expect(res.body.data.name).toBe('Test Role');
            roleId = res.body.data.id;

            // Verify permissions were created
            const permissions = res.body.data.permissions;
            expect(permissions).toBeDefined();
            expect(permissions.length).toBe(2);
            expect(permissions.some((p: any) => p.action === 'read')).toBe(true);
        });

        it('should get roles', async () => {
            const res = await request(app)
                .get('/api/roles')
                .set('Authorization', `Bearer ${token}`)
                .query({ tenantId });

            expect(res.status).toBe(200);
            const role = res.body.data.find((r: any) => r.id === roleId);
            expect(role).toBeDefined();
        });
    });
});
