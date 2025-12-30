# Todo App - DoorAuth Integration Example

A React-based Todo application demonstrating **OAuth 2.0 PKCE authentication** with the **DoorAuth** authentication server.

---

## 🎯 Overview

This application showcases **two integration patterns** with DoorAuth:

### Pattern 1: Direct OAuth Integration
Users log in directly to this app using OAuth 2.0 with PKCE flow.

### Pattern 2: SSO Portal Integration (Recommended)
Users log in to the **DoorAuthSample** dashboard (portal), then launch this app with automatic SSO authentication.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- DoorAuth Server running on `http://localhost:3000`
- App registered in DoorAuth database

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# App will run on http://localhost:5175
```

---

## 📚 Documentation

This project includes comprehensive documentation:

| Document | Description |
|----------|-------------|
| **[SSO_PORTAL_INTEGRATION.md](./SSO_PORTAL_INTEGRATION.md)** | ⭐ **Recommended** - SSO Portal pattern with DoorAuthSample dashboard |
| **[DOORAUTH_INTEGRATION_TUTORIAL.md](./DOORAUTH_INTEGRATION_TUTORIAL.md)** | Complete OAuth 2.0 PKCE integration tutorial |
| **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** | Quick reference guide with common commands |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | System architecture diagrams and flows |

---

## 🏗️ Architecture

### SSO Portal Pattern (Recommended)

```
User → DoorAuthSample Portal → Login → See App Cards → Click Todo App
  → Todo App Opens with SSO Token → Auto Login → Dashboard
```

### Direct OAuth Pattern

```
User → Todo App → Click Login → Redirect to DoorAuth → Enter Credentials
  → Redirect to Callback → Exchange Code for Token → Dashboard
```

---

## 🔑 Key Features

- ✅ **OAuth 2.0 PKCE** - Secure authentication flow
- ✅ **JWT Tokens** - Stateless session management
- ✅ **SSO Support** - Single Sign-On from portal
- ✅ **Protected Routes** - Automatic auth checking
- ✅ **Token Validation** - Expiry checking and auto-logout
- ✅ **Modern UI** - Built with React + TypeScript + Tailwind CSS

---

## 📁 Project Structure

```
client_todo/
├── src/
│   ├── auth/
│   │   ├── authConfig.ts          # OAuth configuration
│   │   └── AuthProvider.tsx       # Auth context & state
│   │
│   ├── services/
│   │   ├── AuthService.ts         # PKCE & OAuth logic
│   │   └── TodoService.ts         # Todo API calls
│   │
│   ├── pages/
│   │   ├── Login.tsx              # Login page
│   │   ├── Callback.tsx           # OAuth callback handler
│   │   └── Dashboard.tsx          # Main app (protected)
│   │
│   └── App.tsx                    # Routing & ProtectedRoute
│
├── DOORAUTH_INTEGRATION_TUTORIAL.md
├── SSO_PORTAL_INTEGRATION.md
├── QUICK_REFERENCE.md
├── ARCHITECTURE.md
└── README.md                      # This file
```

---

## ⚙️ Configuration

### 1. DoorAuth Server Setup

Ensure your app is registered in the database:

```sql
INSERT INTO "Application" (
    id, name, "clientId", "clientSecret", 
    "redirectUris", "allowedScopes", "appUrl", "isActive"
) VALUES (
    gen_random_uuid(),
    'Todo App',
    'todo-app-client',
    'todo-secret-key',
    ARRAY['http://localhost:5175/callback'],
    ARRAY['openid', 'profile', 'email'],
    'http://localhost:5175',  -- For portal card
    true
);
```

### 2. Update Auth Configuration

Edit `src/auth/authConfig.ts`:

```typescript
export const authConfig = {
    authority: 'http://localhost:3000',
    clientId: 'todo-app-client',
    redirectUri: 'http://localhost:5175/callback',
    responseType: 'code',
    scope: 'openid profile email'
};
```

---

## 🧪 Testing

### Test Direct OAuth Flow

1. Start DoorAuth server: `cd server && npm run dev`
2. Start this app: `npm run dev`
3. Navigate to `http://localhost:5175`
4. Click "Login with DoorAuth"
5. Enter credentials on DoorAuth page
6. Verify redirect to dashboard

### Test SSO Portal Flow

1. Start DoorAuth server: `cd server && npm run dev`
2. Start DoorAuthSample: `cd DoorAuthSample && dotnet run`
3. Start this app: `npm run dev`
4. Navigate to `https://localhost:7001` (portal)
5. Login to portal
6. Click "Todo App" card
7. Verify app opens with automatic login

---

## 🔧 Development

### Available Scripts

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **jwt-decode** - JWT token decoding
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "No PKCE verifier found" | Don't clear localStorage between login and callback |
| "Invalid redirect_uri" | Ensure redirect URI matches database exactly |
| CORS errors | Add app URL to DoorAuth CORS whitelist |
| Token expired | App auto-detects and logs out - just login again |
| SSO token not received | Check portal is passing token in URL |

See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for more troubleshooting tips.

---

## 📖 Learn More

### OAuth 2.0 PKCE Flow
1. Generate code verifier and challenge
2. Redirect to authorization endpoint with challenge
3. User authenticates
4. Receive authorization code
5. Exchange code + verifier for access token
6. Use token to access protected resources

### JWT Token Structure
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "tenantId": "tenant-123",
  "name": "John Doe",
  "roles": ["user"],
  "exp": 1704003600
}
```

---

## 🔐 Security

- ✅ PKCE prevents authorization code interception
- ✅ JWT tokens are signed and validated
- ✅ Token expiry prevents replay attacks
- ✅ HTTPS required for production
- ✅ Client secret stored securely (use env vars in production)

---

## 🚀 Deployment

### Production Checklist

- [ ] Use HTTPS for all URLs
- [ ] Store client_secret in environment variables
- [ ] Update CORS origins in DoorAuth server
- [ ] Implement refresh token support
- [ ] Add error tracking (e.g., Sentry)
- [ ] Enable production build optimizations
- [ ] Configure proper CSP headers
- [ ] Set up monitoring and logging

---

## 📝 License

This is a sample application for demonstrating DoorAuth integration.

---

## 🤝 Contributing

This is an example application. For production use, consider:
- Adding refresh token support
- Implementing proper error handling
- Adding loading states
- Enhancing security measures
- Adding comprehensive tests

---

## 📞 Support

For questions or issues:
1. Check the documentation files
2. Review DoorAuth server logs
3. Verify database configuration
4. Check browser console for errors

---

**Created:** 2025-12-30  
**Version:** 2.0  
**DoorAuth Integration:** OAuth 2.0 PKCE + SSO Portal
