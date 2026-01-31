# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DoorAuth Server is a production-ready, self-hosted Central Authentication & Authorization System (Identity Provider) with multi-tenancy, OAuth 2.0/OIDC SSO, RBAC, and dynamic menu management. Built with Node.js/Express backend and React frontend.

## Build & Development Commands

**Important: Do NOT run `dotnet build` unless explicitly requested.**

### Server (Backend)
```bash
cd server
npm install              # Install dependencies
npm run dev              # Start with hot reload (https://localhost:3000)
npm start                # Production start
```

### Client (Admin Frontend)
```bash
cd client
npm install              # Install dependencies
npm run dev              # Start Vite dev server (http://localhost:5173)
npm run build            # Production build
npm run lint             # ESLint
```

### Database (Prisma)
```bash
cd server
npx prisma migrate dev   # Run migrations
npx prisma db seed       # Seed database
npx prisma studio        # Database UI (http://localhost:5555)
```

### Testing
```bash
cd server
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e         # End-to-end tests only
npm run test:coverage    # Coverage report
npm run test:watch       # Watch mode
```

### Utilities
```bash
cd server
npm run seed:admin       # Create tenant admin user
npm run generate-certs   # Generate SSL certificates
```

## Architecture

### Technology Stack
- **Backend**: Node.js 18+ / Express.js / TypeScript
- **Database**: Prisma ORM (SQLite dev, PostgreSQL production)
- **Frontend**: React 19 / Vite / TypeScript / Tailwind CSS
- **Auth**: JWT (HttpOnly cookies), TOTP 2FA, OAuth 2.0/OIDC with PKCE
- **Testing**: Jest / Supertest

### Project Structure
```
AuthenticationSystem/
├── server/              # Backend API
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── services/    # Business logic
│   │   ├── routes/      # API route definitions
│   │   ├── middlewares/ # Auth, tenant scope, permissions
│   │   ├── config/      # Swagger, permissions config
│   │   └── utils/       # Logger, ApiResponse
│   ├── prisma/          # Database schema, migrations, seeds
│   └── tests/           # unit/, integration/, e2e/
├── client/              # Admin dashboard (React)
├── client_todo/         # React SPA OAuth example
└── DoorAuthSample/      # ASP.NET Core OIDC example
```

### Layered Architecture Pattern
```
Controllers → Services → Prisma ORM → Database
```

### Middleware Chain
```
Auth → TenantScope → Permission → Route Handler
```

### Key Architecture Concepts
- **Multi-Tenant Isolation**: All queries scoped by `tenantId`
- **RBAC**: Roles contain permissions; permission middleware enforces access
- **JWT in HttpOnly Cookies**: Tokens stored securely, blacklist for revocation
- **Smart Menus**: Dynamic navigation filtered by user permissions

## API Endpoints

- **Auth**: `/api/auth/*` (register, login, logout)
- **OAuth/OIDC**: `/api/oauth/*` (authorize, token, userinfo, revoke, end_session)
- **OIDC Discovery**: `/.well-known/openid-configuration`, `/.well-known/jwks.json`
- **Management**: `/api/tenants`, `/api/users`, `/api/applications`, `/api/roles`, `/api/menus`
- **Security**: `/api/2fa/*`, `/api/password/*`, `/api/account/*`

**API Documentation**: https://localhost:3000/api-docs (Swagger UI)

## Default Credentials

```
Email: bd@gmail.com
Password: 1q2w3E*
Tenant: Default (ID: 1)
```

## Key Configuration Files

- `server/.env` - Environment variables (see `.env.example`)
- `server/prisma/schema.prisma` - Database schema
- `server/src/config/swagger.ts` - OpenAPI config
- `server/src/config/permissions.ts` - Permission definitions
- `server/jest.config.js` - Test configuration
- `client/vite.config.ts` - Vite build config

## Database Models

Primary entities: Tenant, User, Organization, Application (OAuth clients), Role, Permission, UserRole, Menu, Session, TokenBlacklist, PassToken, EmailVerification, AuditLog

## Important Notes

1. **HTTPS Required**: Generate certs with `npm run generate-certs` before starting
2. **Tenant Isolation**: Always include `tenantId` in queries for proper data isolation
3. **ABP Framework Patterns**: Follow clear architecture principles
4. **SSL Certificates**: Must exist in `server/certs/` for HTTPS
5. **Environment Variables**: Never commit `.env` files
