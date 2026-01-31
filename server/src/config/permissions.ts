/**
 * Permission Configuration for DoorAuthServer
 * 
 * Permissions follow the format: resource:action
 * - resource: The entity or feature being accessed (e.g., 'users', 'roles')
 * - action: The operation being performed (e.g., 'read', 'write', 'approve')
 * 
 * Permission Types:
 * 1. System-Level: Only for Super Admins (e.g., tenant management)
 * 2. Tenant-Scoped: For Tenant Admins within their tenant
 * 3. Application-Specific: Custom permissions for integrated applications
 */

export interface Permission {
    resource: string;
    action: string;
    description: string;
    scope: 'system' | 'tenant' | 'application';
}

export const SYSTEM_PERMISSIONS: Permission[] = [
    // ==========================================
    // SYSTEM-LEVEL PERMISSIONS (Super Admin Only)
    // ==========================================
    {
        resource: 'tenants',
        action: 'read',
        description: 'View all tenants in the system',
        scope: 'system'
    },
    {
        resource: 'tenants',
        action: 'write',
        description: 'Create, update, delete tenants',
        scope: 'system'
    },
    {
        resource: 'system',
        action: 'admin',
        description: 'Full system administration access',
        scope: 'system'
    },

    // Registration Workflow - System Admin Permissions
    {
        resource: 'registration',
        action: 'view_requests',
        description: 'View all registration requests across tenants',
        scope: 'system'
    },
    {
        resource: 'registration',
        action: 'assign_tenant',
        description: 'Assign users to tenants during registration',
        scope: 'system'
    },
    {
        resource: 'registration',
        action: 'reject_request',
        description: 'Reject registration requests',
        scope: 'system'
    },

    // ==========================================
    // TENANT-SCOPED PERMISSIONS (Tenant Admin)
    // ==========================================

    // User Management
    {
        resource: 'users',
        action: 'read',
        description: 'View users within tenant',
        scope: 'tenant'
    },
    {
        resource: 'users',
        action: 'write',
        description: 'Create, update, delete users within tenant',
        scope: 'tenant'
    },
    {
        resource: 'users',
        action: 'approve',
        description: 'Approve or reject user registrations',
        scope: 'tenant'
    },
    {
        resource: 'users',
        action: 'lock',
        description: 'Lock or unlock user accounts',
        scope: 'tenant'
    },
    {
        resource: 'user',
        action: 'view_pending',
        description: 'View pending users awaiting approval in tenant',
        scope: 'tenant'
    },
    {
        resource: 'user',
        action: 'approve',
        description: 'Approve pending users in tenant',
        scope: 'tenant'
    },
    {
        resource: 'user',
        action: 'assign_roles',
        description: 'Assign roles to users in tenant',
        scope: 'tenant'
    },
    {
        resource: 'user',
        action: 'reject',
        description: 'Reject pending users in tenant',
        scope: 'tenant'
    },

    // Role Management
    {
        resource: 'roles',
        action: 'read',
        description: 'View roles within tenant',
        scope: 'tenant'
    },
    {
        resource: 'roles',
        action: 'write',
        description: 'Create, update, delete roles within tenant',
        scope: 'tenant'
    },

    // Application Management
    {
        resource: 'applications',
        action: 'read',
        description: 'View applications within tenant',
        scope: 'tenant'
    },
    {
        resource: 'applications',
        action: 'write',
        description: 'Create, update, delete applications within tenant',
        scope: 'tenant'
    },

    // Menu Management
    {
        resource: 'menus',
        action: 'read',
        description: 'View menus for tenant applications',
        scope: 'tenant'
    },
    {
        resource: 'menus',
        action: 'write',
        description: 'Create, update, delete menus for tenant applications',
        scope: 'tenant'
    },

    // Organization Tree Management
    {
        resource: 'organizations',
        action: 'read',
        description: 'View organization hierarchy within tenant',
        scope: 'tenant'
    },
    {
        resource: 'organizations',
        action: 'write',
        description: 'Create, update, delete organization nodes within tenant',
        scope: 'tenant'
    },

    // Audit Logs
    {
        resource: 'audit-logs',
        action: 'read',
        description: 'View audit logs within tenant',
        scope: 'tenant'
    },

    // ==========================================
    // APPLICATION-SPECIFIC PERMISSIONS
    // ==========================================

    // Accounting App
    {
        resource: 'accounting',
        action: 'read',
        description: 'View accounting data',
        scope: 'application'
    },
    {
        resource: 'accounting',
        action: 'write',
        description: 'Manage accounting records',
        scope: 'application'
    },
];

/**
 * Tenant Admin Role - Default Permissions
 * These permissions define what a Tenant Admin can do within their tenant
 */
export const TENANT_ADMIN_PERMISSIONS = SYSTEM_PERMISSIONS.filter(
    p => p.scope === 'tenant'
).map(p => ({ resource: p.resource, action: p.action }));

/**
 * Super Admin Role - Default Permissions
 * These permissions provide full system access
 */
export const SUPER_ADMIN_PERMISSIONS = SYSTEM_PERMISSIONS.map(
    p => ({ resource: p.resource, action: p.action })
);

/**
 * Helper function to format permission string
 */
export function formatPermission(resource: string, action: string): string {
    return `${resource}:${action}`;
}

/**
 * Helper function to check if a permission is system-level
 */
export function isSystemPermission(resource: string): boolean {
    const permission = SYSTEM_PERMISSIONS.find(p => p.resource === resource);
    return permission?.scope === 'system';
}
