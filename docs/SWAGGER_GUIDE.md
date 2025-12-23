# API Documentation with Swagger

## Overview
Interactive API documentation using Swagger/OpenAPI 3.0 specification.

## Accessing the Documentation

Once the server is running, you can access the interactive API documentation at:

**Swagger UI:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

**OpenAPI JSON:** [http://localhost:3000/api-docs.json](http://localhost:3000/api-docs.json)

---

## Features

- ✅ **Interactive Testing** - Test all API endpoints directly from the browser
- ✅ **Authentication Support** - Built-in JWT bearer token authentication
- ✅ **Request Examples** - Pre-filled example requests for all endpoints
- ✅ **Response Schemas** - Detailed response structure documentation
- ✅ **Organized by Tags** - Endpoints grouped by functionality
- ✅ **Try It Out** - Execute real API calls from the documentation

---

## Using Swagger UI

### 1. Open Swagger UI
Navigate to [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### 2. Explore Endpoints
- Browse endpoints organized by tags (Authentication, 2FA, Password Recovery, etc.)
- Click on any endpoint to see details
- View request/response schemas

### 3. Test Endpoints Without Authentication

**Example: Get Tenants**
1. Find `GET /api/tenants` under the **Tenants** tag
2. Click "Try it out"
3. Click "Execute"
4. View the response

### 4. Test Authenticated Endpoints

**Step 1: Login to Get Token**
1. Find `POST /api/auth/login` under **Authentication**
2. Click "Try it out"
3. Modify the request body with your credentials:
   ```json
   {
     "email": "admin@demo.localhost",
     "password": "password123",
     "tenantId": "your-tenant-id"
   }
   ```
4. Click "Execute"
5. Copy the `token` from the response

**Step 2: Authorize**
1. Click the **"Authorize"** button at the top of the page
2. Enter your token in the format: `Bearer <your-token>`
   - Example: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Click "Authorize"
4. Click "Close"

**Step 3: Test Protected Endpoints**
Now you can test any endpoint that requires authentication:
- `POST /api/2fa/generate`
- `GET /api/account/status`
- etc.

---

## Available Endpoint Groups

### 🔐 Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials

### 🔢 Two-Factor Authentication
- `POST /api/2fa/generate` - Generate 2FA secret
- `POST /api/2fa/verify` - Verify and enable 2FA
- `POST /api/2fa/disable` - Disable 2FA

### 🔑 Password Recovery
- `POST /api/password/forgot-password` - Request password reset
- `POST /api/password/reset-password` - Reset password with token
- `GET /api/password/validate-token` - Validate reset token

### 🛡️ Account Security
- `GET /api/account/status` - Get account security status
- `POST /api/account/unlock` - Unlock account (Admin)
- `POST /api/account/reset-attempts` - Reset login attempts (Admin)

### 🏢 Tenants
- `GET /api/tenants` - Get all tenants

---

## Quick Start Guide

### 1. Get Tenant ID
```bash
GET http://localhost:3000/api/tenants
```

### 2. Login
```bash
POST http://localhost:3000/api/auth/login
{
  "email": "admin@demo.localhost",
  "password": "password123",
  "tenantId": "<from-step-1>"
}
```

### 3. Copy Token
From the login response, copy the `token` value.

### 4. Authorize in Swagger
Click "Authorize" button and paste: `Bearer <your-token>`

### 5. Test Protected Endpoints
Now you can test any authenticated endpoint!

---

## Tips & Tricks

### Copying Responses
- Click the "Download" button to save responses
- Use the copy icon to copy response JSON

### Modifying Requests
- Edit the request body directly in the UI
- Add/remove optional fields as needed
- Use the "Example Value" button to reset

### Viewing Schemas
- Click "Schema" tab to see the full request/response structure
- Expand nested objects for detailed field information

### Testing Error Cases
- Try invalid credentials to see error responses
- Test with missing required fields
- Experiment with different scenarios

---

## Exporting API Specification

### Get OpenAPI JSON
```bash
GET http://localhost:3000/api-docs.json
```

### Use with Other Tools
The OpenAPI specification can be imported into:
- **Postman** - Import collection from URL
- **Insomnia** - Import from URL
- **API Clients** - Generate client SDKs
- **Testing Tools** - Automated API testing

---

## Development

### Adding Documentation to New Endpoints

Add JSDoc comments above route definitions:

```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   post:
 *     summary: Endpoint description
 *     tags: [YourTag]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success response
 */
router.post('/your-endpoint', controller.method);
```

### Updating Swagger Config

Edit `server/src/config/swagger.ts` to:
- Add new tags
- Update server URLs
- Modify API information
- Add custom security schemes

---

## Troubleshooting

### Swagger UI Not Loading
- Check server is running on port 3000
- Clear browser cache
- Check console for errors

### Authorization Not Working
- Ensure token includes "Bearer " prefix
- Check token hasn't expired (1 hour validity)
- Re-login to get fresh token

### Endpoints Not Showing
- Verify route files are in `src/routes/` directory
- Check JSDoc comments are properly formatted
- Restart server to reload documentation

---

## Security Notes

- **Never share your JWT tokens**
- Tokens expire after 1 hour
- Use HTTPS in production
- Don't expose Swagger UI in production (or protect it)

---

## Next Steps

1. Explore all available endpoints
2. Test the complete authentication flow
3. Try enabling 2FA
4. Test password recovery
5. Experiment with account locking

Happy testing! 🚀
