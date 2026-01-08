import { PrismaClient } from '@prisma/client';
import { TENANT_ADMIN_PERMISSIONS } from '../../src/config/permissions';

const prisma = new PrismaClient();

/**
 * Seed script to create Tenant Admin role for all existing tenants
 * Run with: npx ts-node prisma/seeds/seedTenantAdmin.ts
 */
async function seedTenantAdmin() {
    console.log('🌱 Seeding Tenant Admin roles...\n');

    try {
        // Get all tenants
        const tenants = await prisma.tenant.findMany();

        if (tenants.length === 0) {
            console.log('⚠️  No tenants found. Create a tenant first.');
            return;
        }

        for (const tenant of tenants) {
            console.log(`Processing tenant: ${tenant.name} (${tenant.id})`);

            // Check if Tenant Admin role already exists for this tenant
            const existingRole = await prisma.role.findFirst({
                where: {
                    tenantId: tenant.id,
                    name: 'Tenant Admin'
                }
            });

            if (existingRole) {
                console.log(`  ℹ️  Tenant Admin role already exists (${existingRole.id})`);

                // Update permissions if needed
                const existingPermissions = await prisma.permission.findMany({
                    where: { roleId: existingRole.id }
                });

                console.log(`  Current permissions: ${existingPermissions.length}`);
                console.log(`  Expected permissions: ${TENANT_ADMIN_PERMISSIONS.length}`);

                // Delete old permissions and recreate
                await prisma.permission.deleteMany({
                    where: { roleId: existingRole.id }
                });

                // Add all tenant admin permissions
                for (const perm of TENANT_ADMIN_PERMISSIONS) {
                    await prisma.permission.create({
                        data: {
                            roleId: existingRole.id,
                            resource: perm.resource,
                            action: perm.action
                        }
                    });
                }

                console.log(`  ✅ Updated permissions for Tenant Admin role\n`);
                continue;
            }

            // Create Tenant Admin role
            const role = await prisma.role.create({
                data: {
                    name: 'Tenant Admin',
                    description: 'Tenant administrator with full access to tenant resources (cannot create tenants)',
                    tenantId: tenant.id,
                    isSystem: true, // Mark as system role to prevent deletion
                    status: 'active'
                }
            });

            console.log(`  ✅ Created Tenant Admin role (${role.id})`);

            // Add all tenant admin permissions
            for (const perm of TENANT_ADMIN_PERMISSIONS) {
                await prisma.permission.create({
                    data: {
                        roleId: role.id,
                        resource: perm.resource,
                        action: perm.action
                    }
                });
            }

            console.log(`  ✅ Added ${TENANT_ADMIN_PERMISSIONS.length} permissions`);
            console.log(`  Permissions: ${TENANT_ADMIN_PERMISSIONS.map((p: any) => `${p.resource}:${p.action}`).join(', ')}\n`);
        }

        // Optional: Create a Super Admin role for system-level operations
        console.log('Creating Super Admin role for first tenant (if not exists)...');
        const firstTenant = tenants[0];

        const superAdminRole = await prisma.role.findFirst({
            where: {
                tenantId: firstTenant.id,
                name: 'Super Admin'
            }
        });

        if (!superAdminRole) {
            const role = await prisma.role.create({
                data: {
                    name: 'Super Admin',
                    description: 'System administrator with full access to all resources including tenant management',
                    tenantId: firstTenant.id,
                    isSystem: true,
                    status: 'active'
                }
            });

            // Add ALL permissions (system + tenant + application)
            for (const perm of [
                ...TENANT_ADMIN_PERMISSIONS,
                { resource: 'tenants', action: 'read' },
                { resource: 'tenants', action: 'write' },
                { resource: 'system', action: 'admin' }
            ]) {
                await prisma.permission.create({
                    data: {
                        roleId: role.id,
                        resource: perm.resource,
                        action: perm.action
                    }
                });
            }

            console.log(`✅ Created Super Admin role (${role.id})\n`);
        } else {
            console.log(`ℹ️  Super Admin role already exists (${superAdminRole.id})\n`);
        }

        console.log('🎉 Seeding completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   - Tenants processed: ${tenants.length}`);
        console.log(`   - Tenant Admin permissions: ${TENANT_ADMIN_PERMISSIONS.length}`);
        console.log(`   - Super Admin created: ${!superAdminRole ? 'Yes' : 'Already existed'}`);
        console.log('\n💡 Next steps:');
        console.log('   1. Assign users to Tenant Admin role using the API');
        console.log('   2. Test permissions by logging in as a Tenant Admin user');
        console.log('   3. Verify tenant isolation works correctly');

    } catch (error) {
        console.error('❌ Error seeding Tenant Admin roles:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seed function
seedTenantAdmin()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
