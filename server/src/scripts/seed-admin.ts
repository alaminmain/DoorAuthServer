import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedTenantAdmin() {
    const tenantId = process.env.TENANT_ID || 'default-tenant';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@doorauth.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const tenantName = process.env.TENANT_NAME || 'Default Tenant';
    const tenantDomain = process.env.TENANT_DOMAIN || 'default.doorauth.local';

    console.log('🌱 Seeding Tenant Admin...\n');

    try {
        // 1. Create or get tenant
        let tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
        });

        if (!tenant) {
            tenant = await prisma.tenant.create({
                data: {
                    id: tenantId,
                    name: tenantName,
                    domain: tenantDomain
                }
            });
            console.log('✅ Created tenant:', tenant.name);
        } else {
            console.log('ℹ️  Using existing tenant:', tenant.name);
        }

        // 2. Create admin user
        const passwordHash = await bcrypt.hash(adminPassword, 10);

        const adminUser = await prisma.user.upsert({
            where: {
                tenantId_email: {
                    tenantId: tenant.id,
                    email: adminEmail
                }
            },
            update: {
                passwordHash, // Update password if user exists
                isApproved: true,
                isLocked: false
            },
            create: {
                email: adminEmail,
                loginId: adminEmail,
                userName: 'Tenant Administrator',
                passwordHash,
                tenantId: tenant.id,
                isApproved: true,
                isLocked: false
            }
        });
        console.log('✅ Created/Updated admin user:', adminUser.email);

        // 3. Create Tenant Admin role
        const adminRole = await prisma.role.upsert({
            where: {
                tenantId_name: {
                    tenantId: tenant.id,
                    name: 'Tenant Admin'
                }
            },
            update: {
                description: 'Full administrative access to tenant',
                status: 'active'
            },
            create: {
                name: 'Tenant Admin',
                description: 'Full administrative access to tenant',
                tenantId: tenant.id,
                isSystem: true,
                status: 'active'
            }
        });
        console.log('✅ Created/Updated Tenant Admin role');

        // 4. Add permissions to role
        const permissions = [
            { resource: 'users', action: 'read' },
            { resource: 'users', action: 'write' },
            { resource: 'applications', action: 'read' },
            { resource: 'applications', action: 'write' },
            { resource: 'roles', action: 'read' },
            { resource: 'roles', action: 'write' },
            { resource: 'menus', action: 'read' },
            { resource: 'menus', action: 'write' },
            { resource: 'organizations', action: 'read' },
            { resource: 'organizations', action: 'write' },
            { resource: 'tenants', action: 'read' },
            { resource: 'audit-logs', action: 'read' },
        ];

        for (const perm of permissions) {
            await prisma.permission.upsert({
                where: {
                    roleId_resource_action: {
                        roleId: adminRole.id,
                        resource: perm.resource,
                        action: perm.action
                    }
                },
                update: {},
                create: {
                    roleId: adminRole.id,
                    resource: perm.resource,
                    action: perm.action
                }
            });
        }
        console.log(`✅ Added ${permissions.length} permissions to role`);

        // 5. Assign role to user
        await prisma.userRole.upsert({
            where: {
                userId_roleId: {
                    userId: adminUser.id,
                    roleId: adminRole.id
                }
            },
            update: {},
            create: {
                userId: adminUser.id,
                roleId: adminRole.id
            }
        });
        console.log('✅ Assigned Tenant Admin role to user');

        console.log('\n🎉 Tenant Admin seeded successfully!\n');
        console.log('═══════════════════════════════════════');
        console.log('📧 Email:    ', adminEmail);
        console.log('🔑 Password: ', adminPassword);
        console.log('🏢 Tenant:   ', tenant.name);
        console.log('🆔 Tenant ID:', tenant.id);
        console.log('═══════════════════════════════════════\n');
        console.log('🚀 You can now login at: https://localhost:5173');
        console.log('📚 API Docs at: https://localhost:3000/api-docs\n');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}

seedTenantAdmin()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
