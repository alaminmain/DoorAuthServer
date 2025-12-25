# Procedure: Adding Multiple Users with Roles for Todo Application

This guide explains how to create users, define roles specific to the Todo App, and assign them in the DoorAuth system.

## 1. Prerequisites
Ensure all systems are running:
- **Server**: `http://localhost:3000`
- **DoorAuth Admin UI**: `http://localhost:5173`
- **Todo App**: `http://localhost:5175`

## 2. Access the Admin Panel
1. Open [http://localhost:5173](http://localhost:5173).
2. Login with your admin credentials (e.g., `admin@demo.localhost` / `password123`).

## 3. Create a Role for the Todo App
To differentiate Todo App users from other users, creating a specific role is best.

1. Navigate to **Roles & Permissions** (`/roles`) from the sidebar.
2. Click **New Role**.
3. In the form:
   - **Tenant**: Select your tenant (e.g., `Demo Corp`).
   - **Application**: Select **"Todo App"**. This is critical as it scopes the role to this specific app.
   - **Role Name**: Enter a name, e.g., `Todo User`, `Todo Admin`, `Premium User`.
   - **Description**: Add a description (optional).
   - **Permissions**: Select specific permissions if you have created them. For now, the role existence is enough.
4. Click **Create Role**.

Repeat this for other roles if needed (e.g., `Todo Manager`).

## 4. Create New Users
1. Navigate to **Users** (`/users`) from the sidebar.
2. Click **New User**.
3. Fill in the user details:
   - **Login ID**: e.g., `john.doe@company.com`
   - **Email**: `john.doe@company.com`
   - **Name**: `John Doe`
   - **Password**: Set a temporary password.
   - **Status**: Ensure "Approved" is checked.
4. Click **Create User**.

Repeat this step for as many users as you need.

## 5. Assign Roles to Users
Once users and roles exist, you link them.

1. Navigate to **User Roles** (`/user-roles`) from the sidebar (Note: This is a new menu item we just added).
2. **Select User**:
   - In the left panel, search for and click on the user you created (e.g., `John Doe`).
3. **Assign Role**:
   - In the right panel, look at the "Available Roles" list.
   - Find the **"Todo User"** role you created in Step 3.
   - Click the **Checkmark icon** (Assign Role) next to it.
4. The role will move to the "Assigned Roles" list. The user now has access.

## 6. Verify Access
1. Open the Todo App at [http://localhost:5175](http://localhost:5175).
2. Click **Login with DoorAuth**.
3. Enter the credentials of the new user (`john.doe@company.com`).
4. You should be successfully redirected and logged in.

## Automated Setup (Developer Tip)
I have also updated the database seed script to automatically create:
- A generic **"Todo User"** role linked to the Todo App.
- A sample user **`user@demo.localhost`** (Password: `password123`) assigned to this role.

You can use this user immediately for testing.
