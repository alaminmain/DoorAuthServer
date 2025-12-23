# DoorAuthServer

A production-ready, self-hosted **Central Authentication & Authorization System** (IdP) with Multi-Tenancy, OAuth 2.0/OIDC SSO, RBAC, and Dynamic Menu Management.

## 🚀 Features

- ✅ **Multi-Tenant Architecture** - Complete tenant isolation
- ✅ **OAuth 2.0 / OIDC Provider** - Full SSO implementation with PKCE
- ✅ **Authentication** - Register, Login, 2FA with TOTP
- ✅ **Password Recovery** - Email-based password reset
- ✅ **Account Security** - Brute force protection, account locking
- ✅ **RBAC** - Role-based access control with permissions
- ✅ **Smart Menus** - Permission-filtered navigation
- ✅ **Management APIs** - Full CRUD for Tenants, Applications, Roles, Menus
- ✅ **Complete Testing** - Unit, Integration, and E2E tests
- ✅ **API Documentation** - Interactive Swagger UI

## 📊 Project Status

| Component | Status | Details |
|-----------|--------|---------|
| **Backend API** | ✅ Complete | 39+ endpoints, fully tested |
| **OAuth/OIDC** | ✅ Complete | Authorization code flow with PKCE |
| **Multi-Tenancy** | ✅ Complete | Full tenant isolation |
| **RBAC** | ✅ Complete | Roles, permissions, smart menus |
| **Testing** | ✅ Complete | 15 passing tests |
| **Documentation** | ✅ Complete | Swagger + comprehensive guides |
| **Frontend** | 📅 Planned | React admin panel (Phase 5) |

## 🏃 Quick Start

### Prerequisites
- Node.js 18+
- Git

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd DoorAuthServer

# Install dependencies
cd server
npm install

# Setup database
npx prisma migrate dev
npx prisma db seed

# Start the server
npm run dev
```

### Access Points
- **API Server**: http://localhost:3000
- **Swagger UI**: http://localhost:3000/api-docs
- **Prisma Studio**: http://localhost:5555

## 📚 Documentation

Complete documentation is available in the [`docs/`](docs/) folder:

- **[Quick Start Guide](docs/QUICK_START.md)** - Detailed setup instructions
- **[API Documentation](docs/SWAGGER_GUIDE.md)** - How to use Swagger UI
- **[Testing Guide](docs/TESTING_GUIDE.md)** - Running tests
- **[Implementation Summary](docs/IMPLEMENTATION_COMPLETE.md)** - All features
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues

### Feature Guides
- [2FA Guide](docs/2FA_GUIDE.md)
- [Password Recovery](docs/PASSWORD_RECOVERY_GUIDE.md)
- [Account Security](docs/ACCOUNT_SECURITY_GUIDE.md)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:e2e           # E2E tests

# Coverage report
npm run test:coverage
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: Prisma ORM (SQLite/PostgreSQL)
- **Authentication**: JWT, bcrypt, speakeasy (TOTP)
- **Email**: Nodemailer
- **Documentation**: Swagger/OpenAPI

### Testing
- **Framework**: Jest
- **HTTP Testing**: Supertest
- **Coverage**: Istanbul

## 📖 API Endpoints

### Authentication (2)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials

### Two-Factor Authentication (3)
- `POST /api/2fa/generate` - Generate 2FA secret
- `POST /api/2fa/verify` - Verify and enable 2FA
- `POST /api/2fa/disable` - Disable 2FA

### Password Recovery (3)
- `POST /api/password/forgot-password` - Request password reset
- `POST /api/password/reset-password` - Reset password
- `GET /api/password/validate-token` - Validate reset token

### Account Security (3)
- `GET /api/account/status` - Get account status
- `POST /api/account/unlock` - Unlock account
- `POST /api/account/reset-attempts` - Reset login attempts

### OAuth/OIDC (4)
- `GET /oauth/authorize` - Authorization endpoint
- `POST /oauth/token` - Token exchange
- `GET /oauth/userinfo` - User information
- `POST /oauth/revoke` - Revoke token

### Tenant Management (5)
- `GET /api/tenants` - List tenants
- `GET /api/tenants/:id` - Get tenant
- `POST /api/tenants` - Create tenant
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Application Management (6)
- `GET /api/applications` - List applications
- `GET /api/applications/:id` - Get application
- `POST /api/applications` - Create application
- `PUT /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Delete application
- `POST /api/applications/:id/regenerate-secret` - Regenerate secret

### Role Management (7)
- `GET /api/roles` - List roles
- `GET /api/roles/:id` - Get role
- `POST /api/roles` - Create role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `POST /api/roles/:id/permissions` - Add permission
- `DELETE /api/roles/:id/permissions/:permissionId` - Remove permission

### Menu Management (6)
- `GET /api/menus` - List menus
- `GET /api/menus/smart` - Smart menu (filtered by permissions)
- `GET /api/menus/:id` - Get menu
- `POST /api/menus` - Create menu
- `PUT /api/menus/:id` - Update menu
- `DELETE /api/menus/:id` - Delete menu

**Total: 39+ Endpoints**

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - Bcrypt with salt rounds
- **2FA/TOTP** - Time-based one-time passwords
- **PKCE** - Proof Key for Code Exchange (OAuth)
- **Brute Force Protection** - Account locking after failed attempts
- **Email Verification** - Password reset via email
- **Multi-Tenant Isolation** - Complete data separation

## 📁 Project Structure

```
DoorAuthServer/
├── server/                    # Backend API
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── services/          # Business logic
│   │   ├── routes/            # API routes
│   │   ├── middlewares/       # Express middleware
│   │   ├── utils/             # Utilities
│   │   └── config/            # Configuration
│   ├── tests/                 # Test suites
│   │   ├── unit/              # Unit tests
│   │   ├── integration/       # Integration tests
│   │   └── e2e/               # End-to-end tests
│   ├── prisma/                # Database
│   │   ├── schema.prisma      # Database schema
│   │   ├── migrations/        # Migration files
│   │   └── seed.ts            # Seed data
│   └── package.json
├── client/                    # Frontend (Phase 5)
├── docs/                      # Documentation
│   ├── README.md
│   ├── QUICK_START.md
│   ├── TESTING_GUIDE.md
│   └── ... (more guides)
├── PROJECT_PLAN.md            # Implementation roadmap
└── README.md                  # This file
```

## 🎯 Use Cases

This system is perfect for:

1. **SaaS Applications** - Multi-tenant architecture with centralized auth
2. **Enterprise SSO** - Single sign-on for multiple applications
3. **Admin Panels** - Role-based dashboards with dynamic menus
4. **Microservices** - Central authentication service
5. **API Platforms** - OAuth 2.0 provider for third-party integrations

## 🚀 Deployment

The backend is production-ready and can be deployed to:
- Heroku
- AWS (EC2, ECS, Lambda)
- DigitalOcean
- Railway
- Vercel
- Any Node.js hosting platform

See [deployment guide](docs/DEPLOYMENT.md) for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with:
- [Express.js](https://expressjs.com/)
- [Prisma](https://www.prisma.io/)
- [TypeScript](https://www.typescriptlang.org/)
- [Jest](https://jestjs.io/)
- [Swagger](https://swagger.io/)

---

**⭐ Star this repo if you find it useful!**

For detailed documentation, visit the [`docs/`](docs/) folder.
