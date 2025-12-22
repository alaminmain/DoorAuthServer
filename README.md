# DoorAuth - Central Identity & Access Management System

**DoorAuth** is a robust, self-hosted Identity Provider (IdP) designed for multi-tenant architectures. It provides centralized Authentication (SSO, 2FA, Social Login) and Authorization (RBAC, Dynamic Menus) for an ecosystem of applications.

![Status](https://img.shields.io/badge/Status-In%20Development-yellow)
![License](https://img.shields.io/badge/License-MIT-blue)
![Tech](https://img.shields.io/badge/Tech-Node.js%20%7C%20TypeScript%20%7C%20Prisma-green)

## 🚀 Key Features

*   **Central Authentication:** Unified Login Page for all your apps.
*   **Plug & Play SSO:** Standards-compliant **OAuth2 / OIDC** flow (compatible with .NET, Python, JS).
*   **Multi-Tenancy:** Complete data isolation for different organizations.
*   **Authorization Engine:** Granular **RBAC** (Role-Based Access Control) with Permission Scopes.
*   **Dynamic Menus:** A unique feature that manages frontend menu structures centrally based on user permissions.
*   **Security First:** NIST-compliant password policies, Audit Logging, and 2FA (TOTP/SMS).

## 📂 Documentation

*   [**Project Plan & Roadmap**](./PROJECT_PLAN.md) - The architectural blueprint.
*   [**Integration Guide**](./INTEGRATION_GUIDE.md) - How to connect your applications (.NET/Python/Node).
*   [**System Diagrams**](./DIAGRAMS.md) - Visual flows of SSO and Authorization.

## 🛠 Tech Stack

*   **Backend:** Node.js, Express, TypeScript
*   **Database:** PostgreSQL / SQLite (via Prisma ORM)
*   **Security:** Passport.js, Speakeasy (2FA), Bcrypt
*   **Frontend (Admin):** React, Material UI (MUI)

## ⚡ Quick Start (Development)

1.  **Clone the repository**
    ```bash
    git clone https://github.com/alaminmain/DoorAuthServer.git
    cd DoorAuthServer
    ```

2.  **Install Server Dependencies**
    ```bash
    cd server
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 🤝 Contributing

This project is currently under active development. Please see the `PROJECT_PLAN.md` for the current task queue.

## 📄 License

MIT License.
