# OAuth 2.0 & OIDC Implementation Guide

## OAuth 2.0 Grant Types

| Grant Type | Use Case | Security |
|------------|----------|----------|
| Authorization Code + PKCE | Web apps, SPAs, Mobile | Highest |
| Client Credentials | Machine-to-machine | High |
| Refresh Token | Token renewal | High |
| ~~Implicit~~ | Deprecated | Low |
| ~~Password~~ | Deprecated | Low |

---

## Authorization Code + PKCE Flow

### Step 1: Generate PKCE Parameters

```typescript
import crypto from 'crypto';

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

// Usage
const codeVerifier = generateCodeVerifier();
const codeChallenge = generateCodeChallenge(codeVerifier);
// Store codeVerifier in session for later use
```

### Step 2: Authorization Request

```
GET /api/oauth/authorize?
  response_type=code
  &client_id=CLIENT_ID
  &redirect_uri=https://app.example.com/callback
  &scope=openid profile email
  &state=RANDOM_STATE
  &code_challenge=CODE_CHALLENGE
  &code_challenge_method=S256
  &nonce=RANDOM_NONCE
```

### Step 3: Handle Authorization

```typescript
async function handleAuthorize(req: Request, res: Response) {
  const {
    client_id,
    redirect_uri,
    response_type,
    scope,
    state,
    code_challenge,
    code_challenge_method,
    nonce
  } = req.query;

  // Validate client
  const client = await prisma.application.findUnique({
    where: { clientId: client_id }
  });

  if (!client) {
    return res.status(400).json({ error: 'invalid_client' });
  }

  // Validate redirect_uri
  if (!client.redirectUris.includes(redirect_uri)) {
    return res.status(400).json({ error: 'invalid_redirect_uri' });
  }

  // If user not authenticated, redirect to login
  if (!req.user) {
    return res.redirect(`/login?continue=${encodeURIComponent(req.url)}`);
  }

  // Generate authorization code
  const code = crypto.randomBytes(32).toString('hex');

  // Store code with metadata (expires in 10 minutes)
  await redis.setex(
    `auth_code:${code}`,
    600,
    JSON.stringify({
      clientId: client_id,
      userId: req.user.id,
      redirectUri: redirect_uri,
      scope,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
      nonce
    })
  );

  // Redirect with code
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set('code', code);
  redirectUrl.searchParams.set('state', state);

  res.redirect(redirectUrl.toString());
}
```

### Step 4: Token Exchange

```typescript
async function handleToken(req: Request, res: Response) {
  const {
    grant_type,
    code,
    redirect_uri,
    client_id,
    client_secret,
    code_verifier
  } = req.body;

  if (grant_type === 'authorization_code') {
    // Retrieve stored code data
    const codeData = await redis.get(`auth_code:${code}`);
    if (!codeData) {
      return res.status(400).json({ error: 'invalid_grant' });
    }

    const data = JSON.parse(codeData);

    // Verify PKCE
    if (data.codeChallengeMethod === 'S256') {
      const challenge = generateCodeChallenge(code_verifier);
      if (challenge !== data.codeChallenge) {
        return res.status(400).json({ error: 'invalid_grant' });
      }
    }

    // Verify client
    const client = await prisma.application.findUnique({
      where: { clientId: client_id }
    });

    if (client.clientSecret !== client_secret) {
      return res.status(401).json({ error: 'invalid_client' });
    }

    // Delete used code
    await redis.del(`auth_code:${code}`);

    // Generate tokens
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      include: { roles: true }
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);
    const idToken = generateIdToken(user, client_id, data.nonce);

    return res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 900,
      refresh_token: refreshToken,
      id_token: idToken,
      scope: data.scope
    });
  }

  if (grant_type === 'refresh_token') {
    // Handle refresh token grant
    const { refresh_token } = req.body;
    const tokens = await refreshAccessToken(refresh_token);
    return res.json(tokens);
  }

  return res.status(400).json({ error: 'unsupported_grant_type' });
}
```

---

## OIDC ID Token

```typescript
function generateIdToken(
  user: User,
  clientId: string,
  nonce?: string
): string {
  const payload = {
    iss: process.env.ISSUER_URL,
    sub: user.id,
    aud: clientId,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    auth_time: Math.floor(Date.now() / 1000),
    nonce,
    // Standard claims
    name: `${user.firstName} ${user.lastName}`,
    given_name: user.firstName,
    family_name: user.lastName,
    email: user.email,
    email_verified: user.emailVerified,
    picture: user.avatar
  };

  return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
}
```

---

## OIDC Discovery Document

```typescript
// GET /.well-known/openid-configuration
app.get('/.well-known/openid-configuration', (req, res) => {
  const issuer = process.env.ISSUER_URL;

  res.json({
    issuer,
    authorization_endpoint: `${issuer}/api/oauth/authorize`,
    token_endpoint: `${issuer}/api/oauth/token`,
    userinfo_endpoint: `${issuer}/api/oauth/userinfo`,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    revocation_endpoint: `${issuer}/api/oauth/revoke`,
    end_session_endpoint: `${issuer}/api/oauth/end_session`,
    response_types_supported: ['code'],
    grant_types_supported: [
      'authorization_code',
      'refresh_token',
      'client_credentials'
    ],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
    token_endpoint_auth_methods_supported: [
      'client_secret_basic',
      'client_secret_post'
    ],
    claims_supported: [
      'sub', 'name', 'given_name', 'family_name',
      'email', 'email_verified', 'picture'
    ],
    code_challenge_methods_supported: ['S256']
  });
});
```

---

## UserInfo Endpoint

```typescript
// GET /api/oauth/userinfo
app.get('/api/oauth/userinfo', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.sub }
  });

  res.json({
    sub: user.id,
    name: `${user.firstName} ${user.lastName}`,
    given_name: user.firstName,
    family_name: user.lastName,
    email: user.email,
    email_verified: user.emailVerified,
    picture: user.avatar
  });
});
```

---

## Token Revocation

```typescript
// POST /api/oauth/revoke
app.post('/api/oauth/revoke', async (req, res) => {
  const { token, token_type_hint } = req.body;

  try {
    await blacklistToken(token);
    res.status(200).end();
  } catch (error) {
    // Always return 200 per RFC 7009
    res.status(200).end();
  }
});
```

---

## Client Credentials Flow

```typescript
async function handleClientCredentials(req: Request, res: Response) {
  const { client_id, client_secret, scope } = req.body;

  const client = await prisma.application.findUnique({
    where: { clientId: client_id }
  });

  if (!client || client.clientSecret !== client_secret) {
    return res.status(401).json({ error: 'invalid_client' });
  }

  const accessToken = jwt.sign(
    {
      sub: client_id,
      client_id,
      scope,
      type: 'client_credentials'
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    scope
  });
}
```

---

## Consent Screen

```typescript
async function showConsentScreen(req: Request, res: Response) {
  const { client_id, scope } = req.query;

  const client = await prisma.application.findUnique({
    where: { clientId: client_id }
  });

  const scopes = (scope as string).split(' ').map(s => ({
    name: s,
    description: getScopeDescription(s)
  }));

  res.render('consent', {
    clientName: client.name,
    clientLogo: client.logo,
    scopes,
    user: req.user
  });
}

function getScopeDescription(scope: string): string {
  const descriptions: Record<string, string> = {
    openid: 'Verify your identity',
    profile: 'Access your basic profile information',
    email: 'Access your email address',
    offline_access: 'Access your data when you are not present'
  };
  return descriptions[scope] || scope;
}
```
