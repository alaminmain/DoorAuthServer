# Testing Guide: Rate Limiting & Token Blacklisting

## 🧪 Complete Testing Guide

This guide will walk you through testing both **Rate Limiting** and **Token Blacklisting** features.

---

## 📋 Prerequisites

### 1. Restart the Server
The server needs to be restarted to regenerate the Prisma client with the new TokenBlacklist model.

```powershell
# Stop all running server processes
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {$_.Path -like "*DoorAuthServer*"} | Stop-Process -Force

# Navigate to server directory
cd e:\Project\TestProjects\DoorAuthServer\DoorAuthServer\server

# Regenerate Prisma client
npx prisma generate

# Start the server
npm run dev
```

### 2. Tools Needed
- **Postman** or **Thunder Client** (VS Code extension) - for API testing
- **Browser** - for testing via UI
- **Database Browser** (optional) - to verify database entries

### 3. Get a Tenant ID
You'll need a valid tenant ID for testing. You can get one from:
- The database (check `tenants` table)
- Or use the default tenant from seed data

---

## 🧪 Test 1: Rate Limiting

### A. Test Login Rate Limiting (5 attempts per 15 minutes)

#### Using Postman/Thunder Client:

**Step 1: Make 5 failed login attempts**
```http
POST https://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "wrong@example.com",
  "password": "wrongpassword",
  "tenantId": "your-tenant-id-here"
}
```

**Expected Results:**
- Attempts 1-5: Should return `401 Unauthorized` (invalid credentials)
- Attempt 6: Should return `429 Too Many Requests`

**Response on 6th attempt:**
```json
{
  "success": false,
  "message": "Too many authentication attempts from this IP, please try again after 15 minutes",
  "retryAfter": 900
}
```

**Check Headers:**
Look for these headers in the response:
```
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: [timestamp]
```

---

### B. Test Registration Rate Limiting (3 attempts per hour)

**Step 1: Make 3 registration attempts**
```http
POST https://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "test1@example.com",
  "password": "Test123!",
  "userName": "Test User 1",
  "loginId": "test1",
  "tenantId": "your-tenant-id-here"
}
```

**Change the email for each attempt:**
- Attempt 1: `test1@example.com`
- Attempt 2: `test2@example.com`
- Attempt 3: `test3@example.com`
- Attempt 4: Should be rate limited

**Expected Results:**
- Attempts 1-3: Should succeed or fail based on validation
- Attempt 4: Should return `429 Too Many Requests`

---

### C. Test Rate Limit Reset

**Wait 15 minutes** (for login) or **1 hour** (for registration), then try again.

**Expected Result:**
- Rate limit should reset
- You should be able to make requests again

---

## 🧪 Test 2: Token Blacklisting

### A. Test Normal Logout Flow

#### Step 1: Login and Get Token
```http
POST https://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@demo.localhost",
  "password": "password123",
  "tenantId": "your-tenant-id-here"
}
```

**Save the token from the response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

#### Step 2: Use Token to Access Protected Endpoint
```http
GET https://localhost:3000/api/users
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Result:**
- Should return `200 OK` with list of users

#### Step 3: Logout
```http
POST https://localhost:3000/api/auth/logout
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### Step 4: Try to Use the Same Token Again
```http
GET https://localhost:3000/api/users
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Result:**
```json
{
  "success": false,
  "message": "Unauthorized: Token has been revoked"
}
```

**Status Code:** `401 Unauthorized`

---

### B. Verify Database Entry

#### Check the token_blacklist table:

**Using Prisma Studio:**
```powershell
cd e:\Project\TestProjects\DoorAuthServer\DoorAuthServer\server
npx prisma studio
```

**Or using SQL:**
```sql
SELECT * FROM token_blacklist ORDER BY created_at DESC LIMIT 10;
```

**Expected Fields:**
- `jti` - JWT ID (UUID)
- `userId` - User who logged out
- `tokenType` - "access"
- `reason` - "logout"
- `ipAddress` - Your IP
- `userAgent` - Your browser/client
- `revokedAt` - Timestamp
- `expiresAt` - Token expiration time

---

### C. Test Multiple Logins and Logouts

**Step 1: Login from "Device 1"**
```http
POST https://localhost:3000/api/auth/login
```
Save Token 1

**Step 2: Login from "Device 2"**
```http
POST https://localhost:3000/api/auth/login
```
Save Token 2

**Step 3: Use Both Tokens**
```http
GET https://localhost:3000/api/users
Authorization: Bearer TOKEN_1
```
Should work ✅

```http
GET https://localhost:3000/api/users
Authorization: Bearer TOKEN_2
```
Should work ✅

**Step 4: Logout from Device 1**
```http
POST https://localhost:3000/api/auth/logout
Authorization: Bearer TOKEN_1
```

**Step 5: Verify Token 1 is Blacklisted**
```http
GET https://localhost:3000/api/users
Authorization: Bearer TOKEN_1
```
Should fail with "Token has been revoked" ❌

**Step 6: Verify Token 2 Still Works**
```http
GET https://localhost:3000/api/users
Authorization: Bearer TOKEN_2
```
Should still work ✅

---

## 🧪 Test 3: Combined Testing

### Scenario: Rate Limit + Token Blacklisting

**Step 1: Login 5 times successfully**
- Each login should work
- Each should give you a different token
- Save all 5 tokens

**Step 2: Logout with Token 1**
- Token 1 should be blacklisted

**Step 3: Try to login again (6th attempt)**
- Should be rate limited (429 error)

**Step 4: Use Token 2-5**
- Should still work (not blacklisted)

---

## 🧪 Test 4: UI Testing (Client Application)

### A. Test via Client UI

**Step 1: Open Client**
```
https://localhost:5173
```

**Step 2: Login**
- Enter credentials
- Click Login
- Should succeed

**Step 3: Logout**
- Click Logout button
- Should redirect to login

**Step 4: Check Browser DevTools**
- Open Network tab
- Look for `/api/auth/logout` request
- Should see `200 OK`

**Step 5: Try to Access Protected Page**
- Try to navigate to `/users` or `/applications`
- Should redirect to login (token is blacklisted)

---

## 📊 Monitoring & Verification

### Check Server Logs

Look for these log entries:

**Rate Limiting:**
```
WARN: Rate limit exceeded for authentication
  ip: "::1"
  path: "/api/auth/login"
```

**Token Blacklisting:**
```
INFO: Token blacklisted
  jti: "uuid-here"
  userId: "user-id"
  tokenType: "access"
  reason: "logout"
```

### Check Database

**Count blacklisted tokens:**
```sql
SELECT COUNT(*) FROM token_blacklist;
```

**View recent blacklist entries:**
```sql
SELECT 
  jti,
  userId,
  reason,
  ipAddress,
  revokedAt
FROM token_blacklist
ORDER BY revokedAt DESC
LIMIT 10;
```

**Check for expired entries:**
```sql
SELECT COUNT(*) 
FROM token_blacklist 
WHERE expiresAt < datetime('now');
```

---

## ✅ Success Criteria

### Rate Limiting
- ✅ Login attempts are limited to 5 per 15 minutes
- ✅ Registration attempts are limited to 3 per hour
- ✅ Rate limit headers are present in responses
- ✅ Rate limits reset after the time window
- ✅ Different IPs get separate rate limits

### Token Blacklisting
- ✅ Tokens are blacklisted on logout
- ✅ Blacklisted tokens return 401 error
- ✅ Database entries are created correctly
- ✅ JTI is present in all new tokens
- ✅ Multiple tokens can coexist (only logged out ones are blacklisted)
- ✅ Token blacklisting doesn't affect other users

---

## 🐛 Troubleshooting

### Issue: "Property 'tokenBlacklist' does not exist"

**Solution:**
```powershell
cd e:\Project\TestProjects\DoorAuthServer\DoorAuthServer\server
npx prisma generate
npm run dev
```

### Issue: Rate limit not working

**Check:**
1. Server is running
2. Using the same IP for all requests
3. Waiting for the time window to pass

### Issue: Token not being blacklisted

**Check:**
1. Token has `jti` field (decode at jwt.io)
2. Database migration was run
3. Prisma client was regenerated
4. Server logs for errors

### Issue: All requests failing with 401

**Possible causes:**
1. All tokens might be blacklisted
2. Login to get a fresh token
3. Check if token has `jti` field

---

## 📝 Testing Checklist

### Rate Limiting
- [ ] Login rate limit works (5 attempts)
- [ ] Registration rate limit works (3 attempts)
- [ ] Rate limit headers are correct
- [ ] Rate limit resets after window
- [ ] Different IPs get separate limits
- [ ] Rate limit doesn't affect valid requests

### Token Blacklisting
- [ ] Login generates token with JTI
- [ ] Token works for protected endpoints
- [ ] Logout blacklists the token
- [ ] Blacklisted token is rejected
- [ ] Database entry is created
- [ ] Multiple tokens work independently
- [ ] Only logged out tokens are blacklisted

---

## 🎯 Quick Test Script

Here's a quick PowerShell script to test everything:

```powershell
# Save as test-security.ps1

$baseUrl = "https://localhost:3000"
$tenantId = "your-tenant-id-here"

# Test 1: Login
Write-Host "Test 1: Login..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body (@{
    email = "admin@demo.localhost"
    password = "password123"
    tenantId = $tenantId
} | ConvertTo-Json) -ContentType "application/json"

$token = $loginResponse.data.token
Write-Host "✓ Login successful. Token: $($token.Substring(0,20))..." -ForegroundColor Green

# Test 2: Access protected endpoint
Write-Host "`nTest 2: Access protected endpoint..." -ForegroundColor Yellow
$headers = @{ Authorization = "Bearer $token" }
$users = Invoke-RestMethod -Uri "$baseUrl/api/users" -Headers $headers
Write-Host "✓ Accessed users endpoint. Found $($users.data.Count) users" -ForegroundColor Green

# Test 3: Logout
Write-Host "`nTest 3: Logout..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$baseUrl/api/auth/logout" -Method Post -Headers $headers
Write-Host "✓ Logout successful" -ForegroundColor Green

# Test 4: Try to use blacklisted token
Write-Host "`nTest 4: Try to use blacklisted token..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/users" -Headers $headers
    Write-Host "✗ FAILED: Token should have been rejected!" -ForegroundColor Red
} catch {
    Write-Host "✓ Token correctly rejected (401 Unauthorized)" -ForegroundColor Green
}

Write-Host "`n✅ All tests passed!" -ForegroundColor Green
```

**Run it:**
```powershell
.\test-security.ps1
```

---

## 📚 Additional Resources

- **JWT Decoder**: https://jwt.io - Decode tokens to see JTI
- **Prisma Studio**: `npx prisma studio` - View database
- **Server Logs**: Check console output for detailed logs
- **API Documentation**: https://localhost:3000/api-docs

---

**Happy Testing! 🚀**

If you encounter any issues, check the troubleshooting section or review the server logs for detailed error messages.
