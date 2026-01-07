# Vehicle Management System - Menu Integration Guide

This guide explains how to insert the Vehicle Management System menus into the DoorAuth server.

## Menu Structure

The Vehicle Management System has the following menu items:

1. **Dashboard** (`/dashboard`) - `dashboard:read`
2. **Vehicles** (`/vehicles`) - `vehicles:read`
3. **Drivers** (`/drivers`) - `drivers:read`
4. **Bookings** (`/bookings`) - `bookings:read`
5. **Customers** (`/customers`) - `customers:read`
6. **Legal Cases** (`/legalcases`) - `legalcases:read`
7. **Maintenance** (`/maintenance`) - `maintenance:read`
8. **Settings** (`/settings`) - `settings:read`
9. **Tenants** (`/tenants`) - `tenants:read`

Each menu item requires specific permissions (shown in format `resource:action`).

## Method 1: Using the Seed Script (Recommended for Initial Setup)

The menus are already included in the seed script at `server/prisma/seed.ts`. To seed the database with all default data including the Vehicle Management menus:

```bash
cd server
npm run seed
```

This will create:
- The Vehicle Management application
- Owner and ManagementStaff roles with appropriate permissions
- All 9 menu items
- Sample users (owner@vehicle.com and 5 staff users)

## Method 2: Using the TypeScript Script

If you need to insert menus separately or re-insert them:

```bash
cd server
npx ts-node scripts/insert-vehicle-menus.ts
```

**Configuration:**
- Edit `scripts/insert-vehicle-menus.ts`
- Update the `APPLICATION_ID` constant if your Vehicle Management app has a different clientId

**Features:**
- Checks if the application exists
- Lists existing menus (if any)
- Creates all menu items
- Provides a summary of created menus

## Method 3: Using the Web UI (Bulk Import)

The Menus page in the admin panel now supports bulk import via JSON file.

### Steps:

1. **Login to the Admin Panel**
   - Navigate to `https://localhost:3000`
   - Login with admin credentials

2. **Go to Menus Page**
   - Click on "Menus" in the sidebar

3. **Select Application**
   - Choose "Vehicle Management System" from the dropdown

4. **Bulk Import**
   - Click the "Bulk Import" button
   - Select the file: `server/scripts/vehicle-menus.json`
   - The system will import all 9 menu items

### JSON Format

The bulk import expects a JSON file with this structure:

```json
{
  "applicationId": "vehicle-management-web",
  "menus": [
    {
      "label": "Dashboard",
      "path": "/dashboard",
      "icon": "dashboard",
      "order": 1,
      "requiredPermission": "dashboard:read",
      "parentId": null
    }
    // ... more menu items
  ]
}
```

## Method 4: Manual Creation

You can also create menus manually through the UI:

1. Go to the Menus page
2. Select "Vehicle Management System" application
3. Click "Add Menu Item"
4. Fill in the form:
   - **Label**: Display name (e.g., "Dashboard")
   - **Path**: Route path (e.g., "/dashboard")
   - **Icon**: Material icon name (e.g., "dashboard")
   - **Order**: Display order (1-9)
   - **Required Permission**: Permission string (e.g., "dashboard:read")
   - **Parent**: Leave empty for top-level menus

## Verification

After inserting menus, verify they appear correctly:

1. **In the Admin Panel:**
   - Go to Menus page
   - Select "Vehicle Management System"
   - You should see all 9 menu items listed

2. **In the Vehicle Management App:**
   - Login to `https://localhost:7231`
   - Use credentials: `owner@vehicle.com` / `password123`
   - Check the sidebar - all menus should be visible

3. **Test Permissions:**
   - Login as a staff user: `staff1@vehicle.com` / `password123`
   - Staff users should only see: Dashboard, Vehicles (read-only), Drivers (read-only), and Bookings

## Troubleshooting

### Menus not appearing in Vehicle Management app

1. **Check authentication:**
   - Ensure you're logged in
   - Check browser console for errors

2. **Verify permissions:**
   - User must have appropriate role (Owner or ManagementStaff)
   - Role must have permissions matching menu requirements

3. **Check application ID:**
   - Menus must be associated with the correct application
   - Application clientId should be `vehicle-management-web`

4. **Clear cache:**
   - The MenuService caches menus
   - Logout and login again to refresh

### Bulk import fails

1. **Check JSON format:**
   - Ensure valid JSON syntax
   - Must have `menus` array at root level

2. **Check authentication:**
   - You must be logged in with admin privileges
   - Token must be valid

3. **Check application selection:**
   - An application must be selected before importing

## Files Reference

- **Seed Script**: `server/prisma/seed.ts` (lines 320-350)
- **TypeScript Script**: `server/scripts/insert-vehicle-menus.ts`
- **JSON Data**: `server/scripts/vehicle-menus.json`
- **UI Component**: `client/src/pages/Menus.tsx`
- **Menu Service**: `NewVehicleManagment/VehicleManagementSystem/VehicleManagement.UI/Services/MenuService.cs`

## Icons Reference

The system uses Material Icons. Common icons used:

- `dashboard` - Dashboard
- `directions_car` - Vehicles
- `person` - Drivers
- `book_online` - Bookings
- `people` - Customers
- `gavel` - Legal Cases
- `build` - Maintenance
- `settings` - Settings
- `business` - Tenants

For more icons, visit: https://fonts.google.com/icons
