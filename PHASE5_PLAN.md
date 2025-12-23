# Phase 5: Frontend Admin Panel - Implementation Plan

## Overview
Create a modern React admin panel for DoorAuthServer with authentication, tenant management, and application management.

## Technology Stack
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS + shadcn/ui components
- **State Management:** React Context + Hooks
- **HTTP Client:** Axios
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React

## Project Structure
```
client/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── tenants/
│   │   │   ├── TenantList.tsx
│   │   │   ├── TenantForm.tsx
│   │   │   └── TenantCard.tsx
│   │   ├── applications/
│   │   │   ├── ApplicationList.tsx
│   │   │   ├── ApplicationForm.tsx
│   │   │   └── ApplicationCard.tsx
│   │   ├── roles/
│   │   │   ├── RoleList.tsx
│   │   │   ├── RoleForm.tsx
│   │   │   └── PermissionManager.tsx
│   │   ├── menus/
│   │   │   ├── MenuBuilder.tsx
│   │   │   ├── MenuTree.tsx
│   │   │   └── MenuForm.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       └── ... (shadcn components)
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── tenant.service.ts
│   │   ├── application.service.ts
│   │   ├── role.service.ts
│   │   └── menu.service.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTenants.ts
│   │   └── useApplications.ts
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Tenants.tsx
│   │   ├── Applications.tsx
│   │   ├── Roles.tsx
│   │   └── Menus.tsx
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── helpers.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Features to Implement

### 1. Authentication (Priority: High)
- [x] Login page with email/password
- [ ] JWT token storage (localStorage)
- [ ] Auto-refresh on token expiry
- [ ] Protected routes
- [ ] Logout functionality
- [ ] 2FA support (future)

### 2. Dashboard (Priority: High)
- [ ] Overview statistics
- [ ] Recent activity
- [ ] Quick actions
- [ ] System health

### 3. Tenant Management (Priority: High)
- [ ] List all tenants
- [ ] Create new tenant
- [ ] Edit tenant details
- [ ] Delete tenant (with confirmation)
- [ ] View tenant statistics

### 4. Application Management (Priority: High)
- [ ] List applications
- [ ] Create application
- [ ] Edit application
- [ ] Regenerate client secret
- [ ] Delete application
- [ ] Copy client credentials

### 5. Role Management (Priority: Medium)
- [ ] List roles
- [ ] Create role
- [ ] Edit role
- [ ] Assign permissions
- [ ] Delete role

### 6. Menu Builder (Priority: Medium)
- [ ] Visual menu tree
- [ ] Drag-and-drop ordering
- [ ] Create menu items
- [ ] Edit menu items
- [ ] Set permissions
- [ ] Preview menu

### 7. User Management (Priority: Low)
- [ ] List users
- [ ] Create user
- [ ] Assign roles
- [ ] Lock/unlock accounts

## Implementation Phases

### Phase 5.1: Setup & Authentication (Day 1)
1. Initialize Vite project
2. Setup TailwindCSS
3. Install dependencies
4. Create API service layer
5. Implement login page
6. Setup routing
7. Create protected routes

### Phase 5.2: Layout & Dashboard (Day 1-2)
1. Create sidebar navigation
2. Create header with user menu
3. Build dashboard layout
4. Add statistics cards
5. Implement logout

### Phase 5.3: Tenant Management (Day 2)
1. Tenant list page
2. Create tenant form
3. Edit tenant functionality
4. Delete with confirmation
5. Search and filter

### Phase 5.4: Application Management (Day 2-3)
1. Application list page
2. Create application form
3. Edit application
4. Secret regeneration
5. Copy credentials feature

### Phase 5.5: Role & Menu Management (Day 3)
1. Role management UI
2. Permission assignment
3. Menu builder interface
4. Tree view for menus

## Design Guidelines

### Color Scheme
- Primary: Blue (#1976d2)
- Success: Green (#4caf50)
- Warning: Orange (#ff9800)
- Error: Red (#f44336)
- Background: Light gray (#f5f5f5)
- Dark mode support

### Components
- Use shadcn/ui for consistency
- Responsive design (mobile-first)
- Loading states
- Error handling
- Toast notifications

### UX Principles
- Clear navigation
- Confirmation for destructive actions
- Inline validation
- Helpful error messages
- Keyboard shortcuts

## API Integration

### Base Configuration
```typescript
const API_BASE_URL = 'http://localhost:3000/api';
```

### Authentication Flow
1. User enters credentials
2. POST /api/auth/login
3. Store JWT token
4. Set Authorization header
5. Redirect to dashboard

### Error Handling
- Network errors
- 401 Unauthorized → Redirect to login
- 403 Forbidden → Show error
- 500 Server Error → Show error toast

## Next Steps

1. ✅ Create client directory
2. Initialize Vite project with React + TypeScript
3. Install dependencies (TailwindCSS, React Router, Axios, etc.)
4. Setup project structure
5. Create API service layer
6. Implement authentication
7. Build dashboard layout
8. Implement tenant management
9. Implement application management
10. Add role and menu management

## Estimated Timeline
- **Phase 5.1-5.2:** 1-2 days (Core setup + Auth + Layout)
- **Phase 5.3-5.4:** 1-2 days (Tenant + Application management)
- **Phase 5.5:** 1 day (Role + Menu management)
- **Total:** 3-5 days for complete admin panel

## Notes
- Focus on core functionality first
- Add advanced features incrementally
- Ensure mobile responsiveness
- Follow React best practices
- Use TypeScript strictly
- Add proper error boundaries
