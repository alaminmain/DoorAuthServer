# Testing Guide for DoorAuthServer

## Overview
Comprehensive testing strategy for the DoorAuthServer API including unit tests, integration tests, and end-to-end tests.

## Testing Stack
- **Test Framework:** Jest
- **HTTP Testing:** Supertest
- **TypeScript Support:** ts-jest
- **Coverage:** Istanbul (built into Jest)

## Test Structure

```
tests/
├── setup.ts                    # Global test setup
├── unit/                       # Unit tests (isolated)
│   ├── auth.service.test.ts
│   ├── oauth.service.test.ts
│   └── twoFactor.service.test.ts
├── integration/                # Integration tests (with DB)
│   ├── auth.api.test.ts
│   ├── tenant.api.test.ts
│   └── application.api.test.ts
└── e2e/                        # End-to-end tests (full flow)
    └── user-journey.test.ts
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### E2E Tests Only
```bash
npm run test:e2e
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Types

### 1. Unit Tests
**Purpose:** Test individual functions/methods in isolation

**Characteristics:**
- Mock all dependencies (Prisma, bcrypt, jwt, etc.)
- Fast execution
- No database interaction
- Focus on business logic

**Example:**
```typescript
describe('AuthService', () => {
  it('should hash password correctly', async () => {
    // Arrange
    const password = 'test123';
    
    // Act
    const hash = await authService.hashPassword(password);
    
    // Assert
    expect(hash).not.toBe(password);
    expect(hash).toHaveLength(60); // bcrypt hash length
  });
});
```

**Location:** `tests/unit/`

### 2. Integration Tests
**Purpose:** Test API endpoints with real database

**Characteristics:**
- Use real database (test database)
- Test HTTP requests/responses
- Verify database state changes
- Test middleware and validation

**Example:**
```typescript
describe('POST /api/auth/register', () => {
  it('should create user in database', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email, password, tenantId })
      .expect(201);
    
    // Verify in database
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).toBeDefined();
  });
});
```

**Location:** `tests/integration/`

### 3. End-to-End (E2E) Tests
**Purpose:** Test complete user workflows

**Characteristics:**
- Test multiple endpoints in sequence
- Simulate real user behavior
- Verify entire feature flows
- Use authentication tokens

**Example:**
```typescript
describe('Complete OAuth Flow', () => {
  it('should complete authorization code flow', async () => {
    // 1. Register user
    // 2. Login
    // 3. Create application
    // 4. Request authorization
    // 5. Exchange code for token
    // 6. Get user info
  });
});
```

**Location:** `tests/e2e/`

## Writing Tests

### Best Practices

1. **Follow AAA Pattern**
   ```typescript
   it('should do something', () => {
     // Arrange - Setup test data
     const input = 'test';
     
     // Act - Execute the code
     const result = doSomething(input);
     
     // Assert - Verify the result
     expect(result).toBe('expected');
   });
   ```

2. **Use Descriptive Names**
   ```typescript
   // ❌ Bad
   it('test login', () => {});
   
   // ✅ Good
   it('should return 401 when password is incorrect', () => {});
   ```

3. **Test One Thing Per Test**
   ```typescript
   // ❌ Bad - Testing multiple things
   it('should handle user operations', () => {
     // create user
     // update user
     // delete user
   });
   
   // ✅ Good - Separate tests
   it('should create user', () => {});
   it('should update user', () => {});
   it('should delete user', () => {});
   ```

4. **Clean Up After Tests**
   ```typescript
   afterEach(async () => {
     await prisma.user.deleteMany();
   });
   ```

5. **Use Test Data Builders**
   ```typescript
   const createTestUser = (overrides = {}) => ({
     email: 'test@example.com',
     password: 'password123',
     tenantId: 'tenant-123',
     ...overrides,
   });
   ```

## Test Coverage Goals

- **Overall:** 80%+
- **Services:** 90%+
- **Controllers:** 80%+
- **Routes:** 70%+

## Testing Checklist

### For Each Endpoint:

- [ ] **Happy Path** - Test successful case
- [ ] **Validation** - Test missing/invalid fields
- [ ] **Authentication** - Test without token
- [ ] **Authorization** - Test with wrong permissions
- [ ] **Edge Cases** - Test boundary conditions
- [ ] **Error Handling** - Test error scenarios

### Example Test Suite:

```typescript
describe('POST /api/tenants', () => {
  it('✅ should create tenant with valid data');
  it('❌ should return 400 if name is missing');
  it('❌ should return 400 if domain already exists');
  it('❌ should return 401 without authentication');
  it('❌ should return 403 without admin role');
});
```

## Mocking Strategies

### 1. Mock Prisma
```typescript
jest.mock('@prisma/client');
const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
```

### 2. Mock External Services
```typescript
jest.mock('nodemailer');
const mockSendMail = jest.fn();
```

### 3. Mock JWT
```typescript
jest.mock('jsonwebtoken');
(jwt.sign as jest.Mock).mockReturnValue('mock-token');
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Debugging Tests

### Run Single Test File
```bash
npm test -- auth.service.test.ts
```

### Run Single Test
```bash
npm test -- -t "should register user"
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

## Common Test Scenarios

### 1. Authentication Tests
- Register new user
- Login with valid credentials
- Login with invalid credentials
- Account locking after failed attempts
- JWT token generation
- Token expiration

### 2. Authorization Tests
- Access protected route with token
- Access protected route without token
- Access route with insufficient permissions
- Role-based access control

### 3. CRUD Tests
- Create resource
- Read resource
- Update resource
- Delete resource
- List resources with pagination
- Filter and search

### 4. Validation Tests
- Required fields
- Field types
- Field lengths
- Email format
- Password strength
- Unique constraints

### 5. Error Handling Tests
- Database errors
- Network errors
- Invalid input
- Not found (404)
- Server errors (500)

## Performance Testing

### Load Testing with Artillery
```bash
npm install -D artillery
```

```yaml
# load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
      - post:
          url: '/api/auth/login'
          json:
            email: 'test@example.com'
            password: 'password123'
```

Run: `artillery run load-test.yml`

## Security Testing

### Test for Common Vulnerabilities
- SQL Injection
- XSS attacks
- CSRF tokens
- Rate limiting
- Password strength
- JWT security

## Snapshot Testing

For API responses:
```typescript
it('should match snapshot', () => {
  const response = { user: { id: '123', email: 'test@example.com' } };
  expect(response).toMatchSnapshot();
});
```

## Test Database

### Option 1: Separate Test Database
```env
# .env.test
DATABASE_URL="file:./test.db"
```

### Option 2: In-Memory Database
```typescript
// Use SQLite in-memory
DATABASE_URL="file::memory:?cache=shared"
```

## Troubleshooting

### Tests Hanging
- Check for missing `await`
- Ensure database connections are closed
- Check for infinite loops

### Flaky Tests
- Avoid time-dependent tests
- Use proper cleanup
- Don't rely on test order

### Slow Tests
- Mock external services
- Use test database
- Run tests in parallel

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

## Next Steps

1. ✅ Setup Jest configuration
2. ✅ Create test examples
3. [ ] Add more unit tests
4. [ ] Add more integration tests
5. [ ] Setup CI/CD pipeline
6. [ ] Achieve 80%+ coverage
7. [ ] Add performance tests
8. [ ] Add security tests
