# Quick Testing Guide - Security Features

## 🚀 Quick Start

### Option 1: Automated Testing (Recommended)

**Run the automated test script:**

```powershell
cd e:\Project\TestProjects\DoorAuthServer\DoorAuthServer\server\scripts

# Get your tenant ID first (check database or use default)
$tenantId = "your-tenant-id-here"

# Run the test script
.\test-security.ps1 -TenantId $tenantId
```

**What it tests:**
- ✅ Rate limiting (login attempts)
- ✅ Token blacklisting (logout flow)
- ✅ Multiple tokens (independent sessions)

**Expected output:**
```
========================================
  DoorAuth Security Features Test
========================================

Test Suite 1: Rate Limiting
  ✓ PASS: Login Attempt 1
  ✓ PASS: Login Attempt 2
  ...
  ✓ PASS: Login Attempt 6 (Rate limited)

Test Suite 2: Token Blacklisting
  ✓ PASS: Login
  ✓ PASS: Get Users (with valid token)
  ✓ PASS: Logout
  ✓ PASS: Get Users (with blacklisted token - rejected)

Test Suite 3: Multiple Tokens
  ✓ PASS: Both tokens work
  ✓ PASS: Token 1 blacklisted after logout
  ✓ PASS: Token 2 still works

========================================
  Test Results
========================================
Total Tests: 15
Passed: 15
Failed: 0
Pass Rate: 100%

✅ All tests passed!
```

---

### Option 2: Manual Testing (Step by Step)

#### Prerequisites
1. **Restart the server** to regenerate Prisma client:
```powershell
# Stop server
Get-Process -Name node | Where-Object {$_.Path -like "*DoorAuthServer*"} | Stop-Process -Force

# Regenerate Prisma client
cd e:\Project\TestProjects\DoorAuthServer\DoorAuthServer\server
npx prisma generate

# Start server
npm run dev
```

2. **Get a tenant ID** from the database or use default

---

#### Test 1: Rate Limiting (5 minutes)

**Using Postman or Thunder Client:**

1. **Make 6 login attempts with wrong password:**
```http
POST https://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "wrong@example.com",
  "password": "wrongpassword",
  "tenantId": "your-tenant-id"
}
```

2. **Expected results:**
   - Attempts 1-5: `401 Unauthorized`
   - Attempt 6: `429 Too Many Requests`

3. **Success criteria:**
   - ✅ 6th attempt is blocked
   - ✅ Error message says "Too many authentication attempts"
   - ✅ Response includes `retryAfter: 900` (15 minutes)

---

#### Test 2: Token Blacklisting (10 minutes)

**Step 1: Login**
```http
POST https://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@demo.localhost",
  "password": "password123",
  "tenantId": "your-tenant-id"
}
```

**Save the token from response**

**Step 2: Use the token**
```http
GET https://localhost:3000/api/users
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected:** `200 OK` with user list

**Step 3: Logout**
```http
POST https://localhost:3000/api/auth/logout
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected:** `200 OK` with "Logout successful"

**Step 4: Try to use the same token**
```http
GET https://localhost:3000/api/users
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected:** `401 Unauthorized` with "Token has been revoked"

**Success criteria:**
- ✅ Token works before logout
- ✅ Logout succeeds
- ✅ Token is rejected after logout
- ✅ Error message says "Token has been revoked"

---

#### Test 3: Verify Database (2 minutes)

**Open Prisma Studio:**
```powershell
cd e:\Project\TestProjects\DoorAuthServer\DoorAuthServer\server
npx prisma studio
```

**Check `token_blacklist` table:**
- ✅ Should have entries for logged out tokens
- ✅ Each entry should have: `jti`, `userId`, `reason`, `ipAddress`, `userAgent`
- ✅ `reason` should be "logout"

---

### Option 3: UI Testing (Client)

1. **Open client:** `https://localhost:5173`
2. **Login** with valid credentials
3. **Navigate** to a protected page (e.g., Users)
4. **Logout**
5. **Try to navigate** to protected page again
6. **Expected:** Redirected to login (token is blacklisted)

---

## 🎯 Quick Verification Checklist

### Rate Limiting
- [ ] Can make 5 login attempts
- [ ] 6th attempt is blocked with 429
- [ ] Error message is clear
- [ ] Rate limit resets after 15 minutes

### Token Blacklisting
- [ ] Login generates a token
- [ ] Token works for API calls
- [ ] Logout blacklists the token
- [ ] Blacklisted token is rejected
- [ ] Database entry is created
- [ ] Error message says "Token has been revoked"

---

## 🐛 Common Issues

### Issue: "Property 'tokenBlacklist' does not exist"
**Solution:**
```powershell
cd e:\Project\TestProjects\DoorAuthServer\DoorAuthServer\server
npx prisma generate
npm run dev
```

### Issue: Rate limit not working
**Check:**
- Server is running
- Using same IP for all requests
- Not waiting between attempts

### Issue: Token not blacklisted
**Check:**
- Prisma client was regenerated
- Database migration was run
- Token has `jti` field (decode at jwt.io)

---

## 📊 What to Look For

### Server Logs
```
INFO: Token blacklisted
  jti: "uuid-here"
  userId: "user-id"
  reason: "logout"

WARN: Rate limit exceeded for authentication
  ip: "::1"
  path: "/api/auth/login"
```

### Database
```sql
-- Check blacklist entries
SELECT * FROM token_blacklist ORDER BY created_at DESC LIMIT 5;

-- Count blacklisted tokens
SELECT COUNT(*) FROM token_blacklist;
```

---

## ✅ Success Indicators

**You'll know it's working when:**

1. **Rate Limiting:**
   - ✅ 6th login attempt fails with 429
   - ✅ Clear error message
   - ✅ Rate limit headers in response

2. **Token Blacklisting:**
   - ✅ Logout returns success
   - ✅ Same token fails with 401
   - ✅ Database has blacklist entry
   - ✅ New login gets new working token

---

## 📚 Full Documentation

For detailed testing procedures, see:
- `TESTING_GUIDE_SECURITY.md` - Complete testing guide
- `TOKEN_BLACKLISTING_COMPLETE.md` - Token blacklisting details
- `PHASE6_IMPLEMENTATION_STATUS.md` - Overall progress

---

## 🚀 Next Steps

After testing:
1. ✅ Verify all tests pass
2. ✅ Check database entries
3. ✅ Review server logs
4. 🎯 Ready to implement **Session Management** (next feature)

---

**Happy Testing! 🧪**

If you encounter issues, check the full testing guide or server logs for details.
