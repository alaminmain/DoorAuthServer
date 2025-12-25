# Troubleshooting Guide - Common Errors

## Error: "Cannot find module" or Import Errors

### Solution 1: Regenerate Prisma Client
```bash
npx prisma generate
```

### Solution 2: Clear node_modules and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

### Solution 3: Check TypeScript compilation
```bash
npx tsc --noEmit
```

---

## Error: "Port 3000 is already in use"

### Solution 1: Kill the process
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Solution 2: Use different port
```bash
# In .env file
PORT=3001

# Or run with environment variable
PORT=3001 npm run dev
```

---

## Error: "Prisma Client not generated"

### Solution:
```bash
npx prisma generate
npm run dev
```

---

## Error: Database connection failed

### Solution 1: Check database file exists
```bash
# Should see dev.db file
ls prisma/dev.db
```

### Solution 2: Run migrations
```bash
npx prisma migrate dev
```

### Solution 3: Reset database
```bash
npx prisma migrate reset
npx prisma db seed
```

---

## Error: "Module not found: swagger-ui-express"

### Solution:
```bash
npm install swagger-ui-express swagger-jsdoc
npm install --save-dev @types/swagger-ui-express @types/swagger-jsdoc
```

---

## Error: TypeScript errors in test files

### Solution: Install test dependencies
```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

---

## Error: "nodemon: command not found"

### Solution:
```bash
npm install --save-dev nodemon ts-node
```

---

## Error: Environment variables not loading

### Solution: Check .env file exists
```bash
# Create .env if missing
echo DATABASE_URL="file:./dev.db" > .env
echo JWT_SECRET="super-secret-dev-key" >> .env
echo PORT=3000 >> .env
```

---

## Complete Reset (Nuclear Option)

If nothing works, do a complete reset:

```bash
# 1. Stop all running processes
# Press Ctrl+C in all terminals

# 2. Clean everything
rm -rf node_modules
rm -rf dist
rm package-lock.json
rm prisma/dev.db

# 3. Reinstall
npm install

# 4. Setup database
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# 5. Start server
npm run dev
```

---

## Check Server is Running

### Method 1: Check terminal output
Should see:
```
[INFO] Server is running on port 3000
[INFO] API Documentation available at http://localhost:3000/api-docs
```

### Method 2: Test endpoint
```bash
curl http://localhost:3000
```

### Method 3: Open in browser
```
http://localhost:3000
```

---

## OIDC / OAuth Integration Errors

### Error: IDX20803 - Unable to obtain configuration

**Cause**: Cannot access `/.well-known/openid-configuration`

**Solution**:
```bash
# Test the discovery endpoint
curl http://localhost:3000/.well-known/openid-configuration

# If it fails, ensure server is running
npm run dev
```

### Error: IDX20807 - Unable to retrieve document

**Cause**: Network connectivity or server not running

**Solution**:
1. Verify server is running on port 3000
2. Check firewall settings
3. Ensure correct authority URL in client config

### Error: OpenIdConnectProtocolException

**Cause**: Invalid error response format from token endpoint

**Solution**: This has been fixed. Token endpoint now returns standard OAuth 2.0 errors:
```json
{
  "error": "invalid_grant",
  "error_description": "Authorization code expired"
}
```

### Error: Missing id_token in response

**Cause**: ID token not included in token response

**Solution**: This has been fixed. Token response now includes:
- `access_token` - For API access
- `id_token` - For user identity (OIDC)
- `refresh_token` - For token refresh

### Error: Invalid client credentials

**Cause**: Wrong client_id or client_secret

**Solution**:
1. Check credentials in DoorAuth admin panel
2. Verify environment variables match
3. Ensure no trailing spaces in secrets

---

## Common Issues Checklist


- [ ] Node.js 18+ installed
- [ ] All dependencies installed (`npm install`)
- [ ] Prisma Client generated (`npx prisma generate`)
- [ ] Database migrated (`npx prisma migrate dev`)
- [ ] .env file exists with correct values
- [ ] Port 3000 is not in use
- [ ] No TypeScript compilation errors

---

## Get Help

If you're still stuck, please provide:
1. The exact error message
2. Output of `npm run dev`
3. Node version (`node --version`)
4. Operating system

Run this diagnostic:
```bash
echo "Node version:"
node --version

echo "\nNPM version:"
npm --version

echo "\nPrisma version:"
npx prisma --version

echo "\nDatabase file:"
ls -la prisma/dev.db

echo "\nEnvironment:"
cat .env
```
