# DoorAuthServer - Frontend Admin Panel

## 🎯 Phase 5: Frontend Implementation

This is the admin panel for DoorAuthServer - a modern React application for managing tenants, applications, roles, and menus.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Backend server running on `http://localhost:3000`

### Installation
```bash
cd client
npm install
npm run dev
```

The admin panel will be available at `http://localhost:5173`

## 📋 Features

### ✅ Implemented
- Project structure created
- Implementation plan documented

### 🔄 In Progress
- Vite + React + TypeScript setup
- TailwindCSS configuration
- Authentication system

### 📅 Planned
- Dashboard with statistics
- Tenant management CRUD
- Application management CRUD
- Role & permission management
- Menu builder with drag-and-drop
- User management

## 🛠️ Technology Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS + shadcn/ui
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React

## 📁 Project Structure

```
client/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── public/             # Static assets
└── ...config files
```

## 🔐 Authentication

The admin panel uses JWT authentication:

1. Login with email/password
2. Receive JWT token
3. Store token in localStorage
4. Include token in all API requests
5. Auto-refresh on expiry

## 🎨 Design System

### Colors
- **Primary:** Blue (#1976d2)
- **Success:** Green (#4caf50)
- **Warning:** Orange (#ff9800)
- **Error:** Red (#f44336)

### Components
Using shadcn/ui for consistent, accessible components.

## 📖 Documentation

- `PHASE5_PLAN.md` - Detailed implementation plan
- `IMPLEMENTATION_COMPLETE.md` - Backend API documentation

## 🔗 API Integration

The frontend connects to the backend API at `http://localhost:3000/api`

### Available Endpoints
- `/auth/*` - Authentication
- `/tenants/*` - Tenant management
- `/applications/*` - Application management
- `/roles/*` - Role management
- `/menus/*` - Menu management

See Swagger UI at `http://localhost:3000/api-docs` for complete API documentation.

## 🚧 Development Status

**Current Phase:** 5.1 - Setup & Authentication

**Next Steps:**
1. Initialize Vite project
2. Install dependencies
3. Setup TailwindCSS
4. Create API service layer
5. Implement login page
6. Build dashboard layout

## 📝 Notes

- Backend must be running before starting frontend
- Default login: `admin@demo.localhost` / `password123`
- Get tenant ID from `/api/tenants` endpoint

## 🤝 Contributing

This is part of the DoorAuthServer project. See main README for contribution guidelines.

## 📄 License

MIT License - See LICENSE file for details
