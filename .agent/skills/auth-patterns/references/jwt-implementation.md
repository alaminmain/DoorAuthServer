# JWT Implementation Guide

## Token Structure

```
Header.Payload.Signature

Header: { "alg": "RS256", "typ": "JWT" }
Payload: { "sub": "userId", "iat": timestamp, "exp": timestamp, ... }
Signature: RS256(base64(header) + "." + base64(payload), privateKey)
```

## Claims Reference

| Claim | Type | Description |
|-------|------|-------------|
| `sub` | Standard | Subject (user ID) |
| `iat` | Standard | Issued at timestamp |
| `exp` | Standard | Expiration timestamp |
| `iss` | Standard | Issuer URL |
| `aud` | Standard | Audience (client ID) |
| `tenantId` | Custom | Tenant identifier |
| `roles` | Custom | User roles array |
| `permissions` | Custom | Direct permissions |

## Token Generation

```typescript
import jwt from 'jsonwebtoken';

interface TokenPayload {
  sub: string;
  tenantId: number;
  roles: string[];
}

function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '15m',
    issuer: process.env.ISSUER_URL,
    audience: payload.tenantId.toString()
  });
}

function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}
```

## Token Validation

```typescript
function validateToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: process.env.ISSUER_URL,
      algorithms: ['HS256', 'RS256']
    });
    return decoded as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError('Token expired', 'TOKEN_EXPIRED');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError('Invalid token', 'INVALID_TOKEN');
    }
    throw error;
  }
}
```

## Refresh Token Flow

```typescript
async function refreshAccessToken(refreshToken: string) {
  // 1. Validate refresh token
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  // 2. Check if token is blacklisted
  const isBlacklisted = await checkTokenBlacklist(refreshToken);
  if (isBlacklisted) {
    throw new AuthError('Token revoked', 'TOKEN_REVOKED');
  }

  // 3. Get user and validate still active
  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    include: { roles: true }
  });

  if (!user || !user.isActive) {
    throw new AuthError('User not found or inactive', 'USER_INACTIVE');
  }

  // 4. Generate new access token
  const accessToken = generateAccessToken({
    sub: user.id,
    tenantId: user.tenantId,
    roles: user.roles.map(r => r.name)
  });

  // 5. Optionally rotate refresh token
  const newRefreshToken = generateRefreshToken(user.id);
  await blacklistToken(refreshToken);

  return { accessToken, refreshToken: newRefreshToken };
}
```

## Token Blacklist

```typescript
// Using Redis for token blacklist
async function blacklistToken(token: string): Promise<void> {
  const decoded = jwt.decode(token) as { exp: number };
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);

  if (ttl > 0) {
    await redis.setex(`blacklist:${token}`, ttl, '1');
  }
}

async function checkTokenBlacklist(token: string): Promise<boolean> {
  const result = await redis.get(`blacklist:${token}`);
  return result === '1';
}

// Using database for token blacklist
async function blacklistTokenDB(token: string, userId: string): Promise<void> {
  const decoded = jwt.decode(token) as { exp: number };

  await prisma.tokenBlacklist.create({
    data: {
      token: hashToken(token),
      userId,
      expiresAt: new Date(decoded.exp * 1000)
    }
  });
}
```

## Cookie Configuration

```typescript
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 15 * 60 * 1000 // 15 minutes for access token
};

const refreshCookieOptions = {
  ...cookieOptions,
  path: '/api/auth/refresh',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Set tokens in response
res.cookie('accessToken', accessToken, cookieOptions);
res.cookie('refreshToken', refreshToken, refreshCookieOptions);
```

## RS256 (Asymmetric) Setup

```typescript
import fs from 'fs';

const privateKey = fs.readFileSync('certs/private.key');
const publicKey = fs.readFileSync('certs/public.key');

function generateTokenRS256(payload: TokenPayload): string {
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: '15m'
  });
}

function verifyTokenRS256(token: string): TokenPayload {
  return jwt.verify(token, publicKey, {
    algorithms: ['RS256']
  }) as TokenPayload;
}
```

## JWKS Endpoint

```typescript
import jose from 'node-jose';

async function getJWKS() {
  const keystore = jose.JWK.createKeyStore();
  const publicKey = fs.readFileSync('certs/public.key');

  await keystore.add(publicKey, 'pem', { use: 'sig', alg: 'RS256' });

  return keystore.toJSON();
}

// Endpoint: /.well-known/jwks.json
app.get('/.well-known/jwks.json', async (req, res) => {
  const jwks = await getJWKS();
  res.json(jwks);
});
```
