# DoorAuth Integration Guide - Complete Documentation

This guide provides comprehensive documentation for integrating applications with the **DoorAuth** authentication system.

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Integration Patterns](#integration-patterns)
3. [Documentation Index](#documentation-index)
4. [Quick Start](#quick-start)
5. [Example Applications](#example-applications)

---

## 🎯 System Overview

**DoorAuth** is a centralized authentication system that provides:

- **OAuth 2.0 / OpenID Connect** authentication
- **Multi-tenant** support
- **SSO (Single Sign-On)** across applications
- **Role-based access control**
- **JWT token** management

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    DoorAuth Ecosystem                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  DoorAuth    │  │ DoorAuth     │  │  Client      │     │
│  │  Server      │  │ Sample       │  │  Apps        │     │
│  │  (Node.js)   │  │ (ASP.NET)    │  │  (Various)   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │              │
│         └─────────────────┴─────────────────┘              │
│                           │                                 │
│                  ┌────────▼────────┐                       │
│                  │   PostgreSQL    │                       │
│                  │   Database      │                       │
│                  └─────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Integration Patterns

### Pattern 1: SSO Portal Integration (Recommended)

**Best for:** Internal applications, enterprise suites

**Flow:**
1. User logs in to **DoorAuthSample** (central portal)
2. Portal displays app cards for authorized applications
3. User clicks app card
4. App receives SSO token and auto-authenticates
5. User accesses app without separate login

**Benefits:**
- ✅ Single login for all apps
- ✅ Centralized access management
- ✅ Better user experience
- ✅ Easier to manage permissions

**Documentation:**
- `client_todo/SSO_PORTAL_INTEGRATION.md` - Complete SSO guide

### Pattern 2: Direct OAuth Integration

**Best for:** Standalone apps, external applications, mobile apps

**Flow:**
1. User opens application
2. App redirects to DoorAuth login
3. User authenticates
4. DoorAuth redirects back with authorization code
5. App exchanges code for access token
6. User is authenticated

**Benefits:**
- ✅ Independent app operation
- ✅ Standard OAuth 2.0 flow
- ✅ Works for external apps
- ✅ Mobile-friendly

**Documentation:**
- `client_todo/DOORAUTH_INTEGRATION_TUTORIAL.md` - OAuth PKCE guide

---

## 📚 Documentation Index

### Core Documentation

| Document | Location | Description |
|----------|----------|-------------|
| **SSO Portal Integration** | `client_todo/SSO_PORTAL_INTEGRATION.md` | SSO pattern with DoorAuthSample |
| **OAuth Integration Tutorial** | `client_todo/DOORAUTH_INTEGRATION_TUTORIAL.md` | Complete OAuth 2.0 PKCE guide |
| **Quick Reference** | `client_todo/QUICK_REFERENCE.md` | Commands and troubleshooting |
| **Architecture Guide** | `client_todo/ARCHITECTURE.md` | System diagrams and flows |

### Project-Specific Guides

| Project | Documentation |
|---------|---------------|
| **client_todo** | `client_todo/README.md` |
| **client** | `client/README.md` |
| **DoorAuthSample** | `DoorAuthSample/README.md` |
| **server** | `server/README.md` |

---

## 🚀 Quick Start

### 1. Start DoorAuth Server

```bash
cd server
npm install
npm run dev
```

Server runs on: `http://localhost:3000`

### 2. Start DoorAuthSample Portal (Optional - for SSO)

```bash
cd DoorAuthSample
dotnet run --launch-profile "https"
```

Portal runs on: `https://localhost:7001`

### 3. Start Your Application

**Example: Todo App**
```bash
cd client_todo
npm install
npm run dev
```

App runs on: `http://localhost:5175`

---

## 📱 Example Applications

### 1. Todo App (React + TypeScript)

**Location:** `client_todo/`

**Features:**
- OAuth 2.0 PKCE authentication
- SSO support
- JWT token management
- Protected routes

**Documentation:** `client_todo/README.md`

**Integration Pattern:** Both SSO Portal and Direct OAuth

### 2. Client Dashboard (React + TypeScript)

**Location:** `client/`

**Features:**
- User management
- Application management
- Tenant management

**Integration Pattern:** Direct OAuth

### 3. Vehicle Management System (Blazor)

**Location:** `NewVehicleManagment/VehicleManagementSystem/`

**Features:**
- Fleet management
- Multi-tenant support
- Authentication removed (for demo)

**Integration Pattern:** Can be integrated with either pattern

---

## 🔧 Configuration

### Register Application in DoorAuth

All applications must be registered in the database:

```sql
INSERT INTO "Application" (
    id,
    name,
    "clientId",
    "clientSecret",
    "redirectUris",
    "allowedScopes",
    "appUrl",          -- Required for SSO Portal
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    'Your App Name',
    'your-app-client-id',
    'your-app-secret',
    ARRAY['http://localhost:PORT/callback'],
    ARRAY['openid', 'profile', 'email'],
    'http://localhost:PORT',
    true,
    NOW(),
    NOW()
);
```

### Key Configuration Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `name` | Display name in portal | "Todo App" |
| `clientId` | OAuth client identifier | "todo-app-client" |
| `clientSecret` | OAuth client secret | "todo-secret-key" |
| `redirectUris` | OAuth callback URLs | `['http://localhost:5175/callback']` |
| `allowedScopes` | Permitted OAuth scopes | `['openid', 'profile', 'email']` |
| `appUrl` | Portal launch URL | "http://localhost:5175" |

---

## 🧪 Testing Your Integration

### Test Checklist

- [ ] DoorAuth server is running
- [ ] Application is registered in database
- [ ] Configuration matches database entries
- [ ] CORS is configured correctly
- [ ] Redirect URIs match exactly

### Test SSO Portal Flow

1. Start DoorAuth server
2. Start DoorAuthSample portal
3. Start your application
4. Login to portal at `https://localhost:7001`
5. Verify app card appears
6. Click app card
7. Verify automatic login to app

### Test Direct OAuth Flow

1. Start DoorAuth server
2. Start your application
3. Navigate to your app
4. Click login
5. Enter credentials on DoorAuth page
6. Verify redirect to callback
7. Verify successful authentication

---

## 🐛 Common Issues

### Issue: "Invalid redirect_uri"

**Cause:** Redirect URI doesn't match database entry

**Solution:**
```sql
-- Check current redirect URIs
SELECT "redirectUris" FROM "Application" WHERE "clientId" = 'your-client-id';

-- Update if needed
UPDATE "Application" 
SET "redirectUris" = ARRAY['http://localhost:5175/callback']
WHERE "clientId" = 'your-client-id';
```

### Issue: CORS Errors

**Cause:** App URL not in CORS whitelist

**Solution:** Add to `server/src/index.ts`:
```typescript
app.use(cors({
    origin: [
        'http://localhost:5175',  // Your app URL
        'https://localhost:7001', // Portal URL
        // Add other URLs
    ],
    credentials: true
}));
```

### Issue: Token Expired

**Cause:** JWT token has expired

**Solution:** App should auto-detect and redirect to login. If not, clear localStorage and login again.

### Issue: App Card Not Showing in Portal

**Cause:** `appUrl` not set in database

**Solution:**
```sql
UPDATE "Application" 
SET "appUrl" = 'http://localhost:5175'
WHERE "clientId" = 'your-client-id';
```

---

## 🔐 Security Best Practices

### For Development

- ✅ Use PKCE for OAuth flows
- ✅ Validate JWT tokens
- ✅ Check token expiry
- ✅ Use HTTPS for DoorAuthSample
- ✅ Store tokens securely

### For Production

- ✅ Use HTTPS for all services
- ✅ Store secrets in environment variables
- ✅ Implement refresh tokens
- ✅ Add rate limiting
- ✅ Enable CSRF protection
- ✅ Use secure cookie settings
- ✅ Implement proper logging
- ✅ Add monitoring and alerts

---

## 📖 Additional Resources

### OAuth 2.0 & OpenID Connect

- [OAuth 2.0 Specification](https://oauth.net/2/)
- [OpenID Connect](https://openid.net/connect/)
- [PKCE RFC](https://oauth.net/2/pkce/)
- [JWT.io - Token Decoder](https://jwt.io)

### Frameworks & Libraries

- [React](https://react.dev)
- [ASP.NET Core](https://docs.microsoft.com/aspnet/core)
- [Prisma](https://www.prisma.io)
- [Express.js](https://expressjs.com)

---

## 🎓 Learning Path

### For Beginners

1. Read `client_todo/ARCHITECTURE.md` - Understand the system
2. Follow `client_todo/DOORAUTH_INTEGRATION_TUTORIAL.md` - Learn OAuth
3. Try `client_todo/QUICK_REFERENCE.md` - Practice commands

### For Integration

1. Read `client_todo/SSO_PORTAL_INTEGRATION.md` - Understand SSO pattern
2. Register your app in database
3. Implement token reception in your app
4. Test with DoorAuthSample portal

### For Advanced Users

1. Implement refresh tokens
2. Add role-based access control
3. Customize token claims
4. Implement multi-tenant support

---

## 🤝 Support & Contribution

### Getting Help

1. Check the documentation files
2. Review example applications
3. Check DoorAuth server logs
4. Verify database configuration
5. Test with browser DevTools

### Contributing

When adding new applications:
1. Register in database with all required fields
2. Implement proper token handling
3. Add documentation
4. Test both integration patterns
5. Update this guide

---

## 📝 Version History

- **v2.0** (2025-12-30) - Added SSO Portal pattern, comprehensive docs
- **v1.0** (2024-12-24) - Initial OAuth integration

---

**Maintained by:** DoorAuth Team  
**Last Updated:** 2025-12-30  
**License:** Internal Use
