// API Response wrapper
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
}

// User types
export interface User {
    id: string;
    tenantId: string;
    loginId: string;
    userName: string;
    email: string;
    companyName?: string;
    companyAddress?: string;
    designation?: string;
    contact?: string;
    isApproved: boolean;
    isLocked: boolean;
    isTwoFactorEnabled: boolean;
    lastLoginTime?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Tenant types
export interface Tenant {
    id: string;
    name: string;
    domain: string;
    brandingConfig?: Record<string, any>;
    createdAt: Date;
}

export interface CreateTenantDto {
    name: string;
    domain: string;
    brandingConfig?: Record<string, any>;
}

// Application types
export interface Application {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    status: string;
    logoUrl?: string;
    appUrl?: string;
    clientId: string;
    clientSecret?: string;
    redirectUris: string[];
    createdAt: Date;
}

export interface CreateApplicationDto {
    tenantId: string;
    name: string;
    description?: string;
    appUrl?: string;
    logoUrl?: string;
    redirectUris: string[];
}

// Role types
export interface Role {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    isSystem: boolean;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    permissions?: Permission[];
    applicationId?: string;
}

export interface CreateRoleDto {
    tenantId: string;
    name: string;
    description?: string;
    applicationId?: string;
}

// Permission types
export interface Permission {
    id: string;
    roleId: string;
    resource: string;
    action: string;
    description?: string;
}

export interface CreatePermissionDto {
    roleId: string;
    resource: string;
    action: string;
}

// Menu types
export interface Menu {
    id: string;
    applicationId: string;
    label: string;
    path?: string;
    icon?: string;
    parentId?: string;
    order: number;
    requiredPermission?: string;
    children?: Menu[];
}

export interface CreateMenuDto {
    applicationId: string;
    label: string;
    path?: string;
    icon?: string;
    parentId?: string;
    order: number;
    requiredPermission?: string;
}

// Auth types
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    tenantId: string;
    loginId: string;
    userName: string;
    email: string;
    password: string;
    companyName?: string;
    designation?: string;
    contact?: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

// Dashboard stats
export interface DashboardStats {
    totalTenants: number;
    totalApplications: number;
    totalUsers: number;
    totalRoles: number;
    recentActivity: ActivityLog[];
}

export interface ActivityLog {
    id: string;
    action: string;
    resource: string;
    userName: string;
    details?: string;
    ipAddress?: string;
    timestamp: Date;
}

export interface ChangePasswordDto {
    newPassword: string;
}

export interface ChangeLockStatusDto {
    isLocked: boolean;
}
