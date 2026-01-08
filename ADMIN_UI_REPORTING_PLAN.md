# Admin UI & Reporting System - Implementation Plan

## 🎯 Overview

Implement comprehensive admin UI for security management and reporting for both Super Admin and Tenant Admin roles.

---

## 📋 Features to Implement

### Part 1: Security Management UI (Super Admin Only)

#### 1.1 Token Blacklist Management
**Page**: `/admin/security/tokens`

**Features**:
- View all blacklisted tokens
- Filter by user, reason, date range
- Manually revoke tokens
- Revoke all user tokens
- View token details (JTI, user, reason, IP, user agent)
- Export blacklist data

**API Endpoints Needed**:
- `GET /api/admin/tokens/blacklist` - List blacklisted tokens
- `POST /api/admin/tokens/revoke` - Manually revoke a token
- `POST /api/admin/tokens/revoke-user/:userId` - Revoke all user tokens
- `DELETE /api/admin/tokens/blacklist/:id` - Remove from blacklist (cleanup)
- `GET /api/admin/tokens/stats` - Blacklist statistics

---

#### 1.2 Rate Limiting Configuration
**Page**: `/admin/security/rate-limits`

**Features**:
- View current rate limit settings
- Configure limits per endpoint
- View rate limit violations
- Whitelist/blacklist IPs
- Export violation logs

**Configuration Options**:
- Login attempts (default: 5 per 15 min)
- Registration attempts (default: 3 per hour)
- Password reset attempts (default: 3 per hour)
- 2FA attempts (default: 10 per 15 min)
- General API (default: 100 per minute)

**API Endpoints Needed**:
- `GET /api/admin/rate-limits/config` - Get current config
- `PUT /api/admin/rate-limits/config` - Update config
- `GET /api/admin/rate-limits/violations` - Get violation logs
- `POST /api/admin/rate-limits/whitelist` - Add IP to whitelist
- `DELETE /api/admin/rate-limits/whitelist/:ip` - Remove from whitelist

---

### Part 2: Reporting System

#### 2.1 User-wise Role and Application Access Report
**Page**: `/reports/user-access`

**Features**:
- List all users with their roles
- Show applications each user can access
- Filter by tenant (Super Admin only)
- Search by user name/email
- Export to CSV/Excel
- Visual charts (pie chart for role distribution)

**Data Structure**:
```typescript
{
  userId: string;
  userName: string;
  email: string;
  tenant: string;
  roles: [
    {
      roleName: string;
      application: string;
      permissions: string[];
    }
  ];
  applications: string[];
  lastLogin: Date;
}
```

**API Endpoint**:
- `GET /api/reports/user-access` - Get user access report
- `GET /api/reports/user-access/:userId` - Get specific user access

---

#### 2.2 Application-wise User List Report
**Page**: `/reports/application-users`

**Features**:
- List all applications
- Show users who have access to each application
- Show roles assigned per application
- Filter by tenant (Super Admin only)
- Export to CSV/Excel
- Visual charts (bar chart for users per app)

**Data Structure**:
```typescript
{
  applicationId: string;
  applicationName: string;
  tenant: string;
  totalUsers: number;
  users: [
    {
      userId: string;
      userName: string;
      email: string;
      roles: string[];
      lastAccess: Date;
    }
  ];
  roleDistribution: {
    roleName: string;
    userCount: number;
  }[];
}
```

**API Endpoint**:
- `GET /api/reports/application-users` - Get application users report
- `GET /api/reports/application-users/:appId` - Get specific app users

---

#### 2.3 User Login Log Report
**Page**: `/reports/login-logs`

**Features**:
- View all login attempts (success/failure)
- Filter by user, date range, status
- Show IP address, user agent, location
- Detect suspicious activity
- Export to CSV/Excel
- Visual charts (timeline of logins, success vs failure)

**Data Structure**:
```typescript
{
  id: string;
  userId: string;
  userName: string;
  email: string;
  tenant: string;
  loginTime: Date;
  status: 'success' | 'failed' | 'locked' | '2fa_required';
  ipAddress: string;
  userAgent: string;
  location?: string;
  failureReason?: string;
}
```

**API Endpoint**:
- `GET /api/reports/login-logs` - Get login logs
- `GET /api/reports/login-logs/:userId` - Get user-specific logs
- `GET /api/reports/login-stats` - Get login statistics

---

#### 2.4 User Role Assign/Revoke History
**Page**: `/reports/role-history`

**Features**:
- View all role assignments and revocations
- Filter by user, role, date range
- Show who made the change (admin)
- Export to CSV/Excel
- Visual timeline of changes

**Data Structure**:
```typescript
{
  id: string;
  userId: string;
  userName: string;
  roleId: string;
  roleName: string;
  action: 'assigned' | 'revoked';
  performedBy: string;
  performedByName: string;
  timestamp: Date;
  reason?: string;
}
```

**API Endpoint**:
- `GET /api/reports/role-history` - Get role change history
- `GET /api/reports/role-history/:userId` - Get user-specific history

---

#### 2.5 Tenant User Activity Report
**Page**: `/reports/user-activity`

**Features**:
- View all user activities (CRUD operations)
- Filter by user, action type, resource, date range
- Show details of each action
- Detect unusual patterns
- Export to CSV/Excel
- Visual charts (activity heatmap, action distribution)

**Data Structure**:
```typescript
{
  id: string;
  userId: string;
  userName: string;
  tenant: string;
  action: string; // 'CREATE', 'READ', 'UPDATE', 'DELETE'
  resource: string; // 'user', 'role', 'application', etc.
  resourceId: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
}
```

**API Endpoint**:
- `GET /api/reports/user-activity` - Get user activity
- `GET /api/reports/user-activity/:userId` - Get specific user activity
- `GET /api/reports/activity-stats` - Get activity statistics

---

## 🏗️ Implementation Structure

### Backend (Server)

```
server/src/
├── controllers/
│   ├── admin/
│   │   ├── tokenBlacklist.controller.ts
│   │   └── rateLimitConfig.controller.ts
│   └── reports/
│       ├── userAccess.controller.ts
│       ├── applicationUsers.controller.ts
│       ├── loginLogs.controller.ts
│       ├── roleHistory.controller.ts
│       └── userActivity.controller.ts
├── services/
│   ├── admin/
│   │   ├── tokenBlacklistAdmin.service.ts
│   │   └── rateLimitConfig.service.ts
│   └── reports/
│       ├── userAccessReport.service.ts
│       ├── applicationUsersReport.service.ts
│       ├── loginLogsReport.service.ts
│       ├── roleHistoryReport.service.ts
│       └── userActivityReport.service.ts
├── routes/
│   ├── admin.routes.ts
│   └── reports.routes.ts
└── middlewares/
    └── superAdminOnly.middleware.ts
```

### Frontend (Client)

```
client/src/
├── pages/
│   ├── admin/
│   │   ├── SecurityDashboard.tsx
│   │   ├── TokenBlacklist.tsx
│   │   └── RateLimitConfig.tsx
│   └── reports/
│       ├── ReportsDashboard.tsx
│       ├── UserAccessReport.tsx
│       ├── ApplicationUsersReport.tsx
│       ├── LoginLogsReport.tsx
│       ├── RoleHistoryReport.tsx
│       └── UserActivityReport.tsx
├── components/
│   ├── admin/
│   │   ├── TokenBlacklistTable.tsx
│   │   ├── RateLimitForm.tsx
│   │   └── SecurityStats.tsx
│   └── reports/
│       ├── ReportFilters.tsx
│       ├── ReportTable.tsx
│       ├── ReportCharts.tsx
│       └── ExportButton.tsx
└── services/
    ├── admin.service.ts
    └── reports.service.ts
```

---

## 📊 Database Schema Updates

### New Tables Needed

#### 1. Login Logs
```prisma
model LoginLog {
  id            String   @id @default(uuid())
  userId        String
  status        String   // 'success' | 'failed' | 'locked' | '2fa_required'
  ipAddress     String?
  userAgent     String?
  location      String?
  failureReason String?
  createdAt     DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@map("login_logs")
}
```

#### 2. Role History
```prisma
model RoleHistory {
  id            String   @id @default(uuid())
  userId        String
  roleId        String
  action        String   // 'assigned' | 'revoked'
  performedBy   String
  reason        String?
  createdAt     DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([roleId])
  @@index([action])
  @@index([createdAt])
  @@map("role_history")
}
```

#### 3. Rate Limit Config
```prisma
model RateLimitConfig {
  id          String   @id @default(uuid())
  endpoint    String   @unique
  windowMs    Int      // Time window in milliseconds
  maxRequests Int      // Max requests per window
  enabled     Boolean  @default(true)
  updatedBy   String?
  updatedAt   DateTime @updatedAt
  
  @@map("rate_limit_config")
}
```

#### 4. IP Whitelist
```prisma
model IPWhitelist {
  id          String   @id @default(uuid())
  ipAddress   String   @unique
  description String?
  addedBy     String
  createdAt   DateTime @default(now())
  
  @@map("ip_whitelist")
}
```

---

## 🎨 UI Components

### Common Components

1. **ReportFilters** - Reusable filter component
2. **ReportTable** - Data table with sorting, pagination
3. **ReportCharts** - Chart visualization (Chart.js or Recharts)
4. **ExportButton** - Export to CSV/Excel
5. **DateRangePicker** - Date range selection
6. **UserSelector** - User dropdown/autocomplete
7. **TenantSelector** - Tenant dropdown (Super Admin only)

---

## 🔐 Permissions

### Super Admin Only
- Token Blacklist Management
- Rate Limit Configuration
- Cross-tenant reports
- IP Whitelist management

### Tenant Admin
- View own tenant's reports
- View own tenant's users
- Cannot modify security settings
- Cannot see other tenants

---

## 📅 Implementation Timeline

### Phase 1: Backend (2-3 days)
- Day 1: Database schema + Login logs + Role history
- Day 2: Report services + API endpoints
- Day 3: Admin services + Security endpoints

### Phase 2: Frontend (3-4 days)
- Day 1: Report pages + Filters
- Day 2: Charts + Export functionality
- Day 3: Admin pages (Token blacklist, Rate limits)
- Day 4: Polish + Testing

### Phase 3: Testing & Documentation (1 day)
- Integration testing
- Documentation
- User guide

**Total: 6-8 days**

---

## 🎯 Priority Order

1. **High Priority** (Implement First)
   - User Login Log (2.3)
   - User Activity Report (2.5)
   - User-wise Role Access (2.1)

2. **Medium Priority**
   - Application-wise Users (2.2)
   - Role History (2.4)

3. **Low Priority** (Nice to Have)
   - Token Blacklist UI (1.1)
   - Rate Limit Config UI (1.2)

---

## 📝 Next Steps

1. Review and approve this plan
2. Decide on priority order
3. Start with database schema updates
4. Implement backend services
5. Build frontend UI
6. Test and deploy

---

**Ready to start implementation? Which feature should we tackle first?**

Recommended: Start with **User Login Log** as it's the foundation for security monitoring.
