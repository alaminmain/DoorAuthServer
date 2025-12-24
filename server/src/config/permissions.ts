export const SYSTEM_PERMISSIONS = [
    { resource: 'tenants', action: 'read', description: 'View tenants' },
    { resource: 'tenants', action: 'write', description: 'Create, update, delete tenants' },

    { resource: 'users', action: 'read', description: 'View users' },
    { resource: 'users', action: 'write', description: 'Create, update, delete users' },

    { resource: 'roles', action: 'read', description: 'View roles' },
    { resource: 'roles', action: 'write', description: 'Create, update, delete roles' },

    { resource: 'applications', action: 'read', description: 'View applications' },
    { resource: 'applications', action: 'write', description: 'Create, update, delete applications' },

    { resource: 'menus', action: 'read', description: 'View menus' },
    { resource: 'menus', action: 'write', description: 'Create, update, delete menus' },

    { resource: 'audit-logs', action: 'read', description: 'View audit logs' },
];
