# Quick Start Guide - DoorAuthServer

## 🚀 How to Run the Project

### Prerequisites
- Node.js 18+ installed
- Git installed
- Terminal/Command Prompt

---

## Step-by-Step Setup

### 1. Navigate to Server Directory
```bash
cd e:\Project\TestProjects\DoorAuthServer\DoorAuthServer\server
```

### 2. Install Dependencies (if not already done)
```bash
npm install
```

### 3. Setup Database
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database with demo data
npx prisma db seed
```

### 4. Start the Server
```bash
# Development mode (with auto-reload)
npm run dev
```

**Server will start at:** `http://localhost:3000`

---

## ✅ Verify Server is Running

### Option 1: Check Terminal
You should see:
```
[INFO] Server running on port 3000
[INFO] Swagger UI available at http://localhost:3000/api-docs
[INFO] API Documentation available at http://localhost:3000/api-docs.json
```

### Option 2: Open Swagger UI
Open browser: `http://localhost:3000/api-docs`

### Option 3: Test API Endpoint
```bash
# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/tenants -Method GET

# Or use browser
# Open: http://localhost:3000/api/tenants
```

---

## 🧪 How to Run Tests

### 1. Make Sure Server is Running
The integration and E2E tests need the database to be set up.

### 2. Run All Tests
```bash
npm test
```

**Expected Output:**
```
PASS  tests/unit/auth.service.test.ts
  AuthService - Unit Tests
    register
      ✓ should successfully register a new user
      ✓ should throw error if user already exists
    login
      ✓ should successfully login with valid credentials
      ✓ should throw error with invalid credentials
      ✓ should throw error if account is locked

Test Suites: 3 passed, 3 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        5.234s
```

### 3. Run Specific Test Types

#### Unit Tests Only (Fast)
```bash
npm run test:unit
```
- No database required
- Mocked dependencies
- Very fast (~1-2 seconds)

#### Integration Tests Only
```bash
npm run test:integration
```
- Uses real database
- Tests HTTP endpoints
- Slower (~5-10 seconds)

#### E2E Tests Only
```bash
npm run test:e2e
```
- Complete user workflows
- Multiple endpoints
- Slowest (~10-15 seconds)

### 4. Watch Mode (for Development)
```bash
npm run test:watch
```
- Automatically re-runs tests when files change
- Great for TDD (Test-Driven Development)
- Press `q` to quit

### 5. Coverage Report
```bash
npm run test:coverage
```

**Output:**
```
----------------------|---------|----------|---------|---------|
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
All files             |   85.23 |    78.45 |   82.15 |   85.67 |
 services/            |   92.45 |    85.23 |   90.12 |   92.78 |
  auth.service.ts     |   94.23 |    88.45 |   92.34 |   94.56 |
  oauth.service.ts    |   90.67 |    82.01 |   88.90 |   90.99 |
 controllers/         |   82.34 |    75.67 |   80.45 |   82.89 |
  auth.controller.ts  |   85.67 |    78.90 |   83.45 |   86.12 |
----------------------|---------|----------|---------|---------|
```

Coverage report will be in: `coverage/index.html`

---

## 📊 Test Results Explained

### ✅ Passing Test
```
✓ should successfully register a new user (5ms)
```
- ✅ Green checkmark = Test passed
- `(5ms)` = Execution time

### ❌ Failing Test
```
✕ should throw error if user already exists (3ms)
```
- ❌ Red X = Test failed
- Shows error details below

### ⊘ Skipped Test
```
○ should handle 2FA login (skipped)
```
- Test was skipped (using `it.skip()`)

---

## 🔍 Running Specific Tests

### Run Single Test File
```bash
npm test -- auth.service.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should register"
```

### Run Tests in Specific Directory
```bash
npm test -- tests/unit
```

---

## 🐛 Debugging Tests

### 1. Add Console Logs
```typescript
it('should register user', async () => {
  console.log('Testing registration...');
  const result = await authService.register({...});
  console.log('Result:', result);
  expect(result).toBeDefined();
});
```

### 2. Run Single Test with Verbose
```bash
npm test -- --verbose auth.service.test.ts
```

### 3. Use VS Code Debugger
1. Set breakpoint in test file
2. Press F5
3. Select "Jest Debug" configuration

---

## 📝 Common Commands Cheat Sheet

### Server Commands
```bash
# Start development server
npm run dev

# Start production server
npm start

# Open Prisma Studio (Database GUI)
npx prisma studio
```

### Database Commands
```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

### Test Commands
```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## 🎯 Typical Workflow

### 1. Start Development
```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Run tests in watch mode
npm run test:watch

# Terminal 3: Open Prisma Studio (optional)
npx prisma studio
```

### 2. Make Changes
- Edit code in `src/`
- Server auto-reloads (nodemon)
- Tests auto-run (watch mode)

### 3. Before Committing
```bash
# Run all tests
npm test

# Check coverage
npm run test:coverage

# Ensure server starts
npm run dev
```

---

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **API Server** | http://localhost:3000 | Main API |
| **Swagger UI** | http://localhost:3000/api-docs | Interactive API docs |
| **Prisma Studio** | http://localhost:5555 | Database GUI |
| **Coverage Report** | coverage/index.html | Test coverage |

---

## 📦 Project Structure

```
DoorAuthServer/
├── server/                    # Backend API
│   ├── src/                   # Source code
│   │   ├── controllers/       # Request handlers
│   │   ├── services/          # Business logic
│   │   ├── routes/            # API routes
│   │   ├── middlewares/       # Express middleware
│   │   └── utils/             # Utilities
│   ├── tests/                 # Test files
│   │   ├── unit/              # Unit tests
│   │   ├── integration/       # Integration tests
│   │   └── e2e/               # E2E tests
│   ├── prisma/                # Database
│   │   ├── schema.prisma      # Database schema
│   │   ├── migrations/        # Migration files
│   │   └── seed.ts            # Seed data
│   └── package.json           # Dependencies
└── client/                    # Frontend (Phase 5)
```

---

## 🔧 Troubleshooting

### Server Won't Start
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill process if needed
taskkill /PID <PID> /F

# Or use different port
PORT=3001 npm run dev
```

### Database Errors
```bash
# Reset database
npx prisma migrate reset

# Regenerate Prisma Client
npx prisma generate

# Re-seed database
npx prisma db seed
```

### Tests Failing
```bash
# Clear Jest cache
npx jest --clearCache

# Run tests with verbose output
npm test -- --verbose

# Run single failing test
npm test -- --testNamePattern="failing test name"
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Next Steps

### 1. Explore API with Swagger
- Open http://localhost:3000/api-docs
- Try the `/api/tenants` endpoint
- Register a user
- Login and get token
- Test protected endpoints

### 2. Run Tests
```bash
npm test
```

### 3. Check Coverage
```bash
npm run test:coverage
open coverage/index.html
```

### 4. Add More Tests
- Copy example tests
- Modify for your endpoints
- Run `npm run test:watch`

### 5. Build Frontend (Phase 5)
```bash
cd ../client
# Follow client/README.md
```

---

## 🎊 Quick Test

### 1. Start Server
```bash
npm run dev
```

### 2. In Another Terminal, Run Tests
```bash
npm test
```

### 3. Open Swagger UI
```
http://localhost:3000/api-docs
```

**If all three work, you're ready to go!** 🚀

---

## 💡 Tips

1. **Use Watch Mode** - `npm run test:watch` for instant feedback
2. **Check Swagger** - Always test endpoints in Swagger first
3. **Use Prisma Studio** - Visual database management
4. **Read Test Output** - Jest gives helpful error messages
5. **Start Simple** - Run unit tests first, then integration

---

## 📞 Need Help?

- Check `TESTING_GUIDE.md` for detailed testing info
- Check `IMPLEMENTATION_COMPLETE.md` for API documentation
- Check `SWAGGER_GUIDE.md` for API testing guide
- Open Swagger UI for interactive API exploration

---

**Happy Testing!** 🧪✨
