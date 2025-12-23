# DoorAuth Admin Panel

Modern React Admin Panel for DoorAuth Server.

## Features

- 🎨 **Modern Design**: Glassmorphism, Dark Mode, Responsive Layout.
- 🔐 **Authentication**: Secure Login with JWT handling.
- 🏢 **Tenant Management**: Create, Update, Delete Tenants.
- 📱 **Application Management**: Manage OIDC Clients, Regenerate Secrets.
- 📊 **Dashboard**: System Overview.

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** (Build Tool)
- **TailwindCSS** (Styling)
- **React Hook Form** + **Zod** (Forms & Validation)
- **Lucide React** (Icons)
- **Axios** (API Client)

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```
2. **Run Development Server**
   ```bash
   npm run dev
   ```
3. **Build for Production**
   ```bash
   npm run build
   ```

## Configuration

The API URL defaults to `http://localhost:3000/api`.
To override, create a `.env` file:
```
VITE_API_URL=http://your-api-url/api
```
