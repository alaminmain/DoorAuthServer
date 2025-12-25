# JWKS (JSON Web Key Set) Implementation

## Overview

DoorAuth now implements proper JWKS with RSA key pairs for production-ready token signing and verification.

## Features

### ✅ Automatic Key Generation
- Generates 2048-bit RSA key pairs on first startup
- Stores keys in `server/keys/` directory
- Reuses existing keys on subsequent startups

### ✅ JWKS Endpoint
**URL**: `/.well-known/jwks.json`

Returns public keys in JWK format for token verification:
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "kid": "a1b2c3d4e5f6g7h8",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

### ✅ Key Management
- **Key ID (kid)**: Unique identifier for each key
- **Algorithm**: RS256 (RSA with SHA-256)
- **Key Rotation**: Supported via `jwksService.rotateKeys()`
- **Backup**: Old keys are backed up during rotation

## File Structure

```
server/
├── keys/                    # Auto-generated, git-ignored
│   ├── private.pem         # RSA private key (NEVER commit!)
│   └── public.pem          # RSA public key
└── src/
    └── services/
        └── jwks.service.ts # Key management service
```

## Security

### 🔒 Private Key Protection
- Private keys are stored in `server/keys/` directory
- **NEVER commit private keys to version control**
- `.gitignore` excludes `keys/` directory
- Keys are generated with 2048-bit strength

### 🔑 Key Rotation
For production, rotate keys periodically:

```typescript
import { jwksService } from './services/jwks.service';

// Rotate keys (creates backup of old keys)
jwksService.rotateKeys();
```

## Usage

### Client-Side Token Verification

**.NET Example:**
```csharp
services.AddAuthentication()
    .AddJwtBearer(options =>
    {
        options.Authority = "http://localhost:3000";
        options.RequireHttpsMetadata = false; // Dev only
        
        // Automatically fetches JWKS from /.well-known/jwks.json
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidIssuer = "http://localhost:3000",
            ValidAudience = "your-client-id"
        };
    });
```

**JavaScript Example:**
```typescript
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL('http://localhost:3000/.well-known/jwks.json')
);

async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: 'http://localhost:3000',
    audience: 'your-client-id'
  });
  return payload;
}
```

## Logging

The JWKS service logs all key operations:

```
[INFO] [JWKS] Created keys directory
[INFO] [JWKS] Generating new RSA key pair...
[INFO] [JWKS] Generated and saved new RSA keys { kid: "a1b2c3d4e5f6g7h8" }
[INFO] [OIDC] JWKS endpoint accessed { clientIp: "::1" }
[INFO] [OIDC] Returning JWKS { key_count: 1, kid: "a1b2c3d4e5f6g7h8" }
```

## Production Deployment

### 1. Key Persistence
Ensure the `keys/` directory persists across deployments:

**Docker:**
```dockerfile
VOLUME ["/app/server/keys"]
```

**Kubernetes:**
```yaml
volumes:
  - name: jwks-keys
    persistentVolumeClaim:
      claimName: doorauth-keys-pvc
```

### 2. Key Backup
Regularly backup your private keys:
```bash
# Backup keys
tar -czf keys-backup-$(date +%Y%m%d).tar.gz server/keys/

# Store in secure location (encrypted storage)
```

### 3. Key Rotation Schedule
- **Development**: No rotation needed
- **Staging**: Monthly rotation
- **Production**: Quarterly rotation or after security incidents

### 4. Multi-Instance Deployment
For load-balanced deployments:
- **Option A**: Share keys via mounted volume
- **Option B**: Use a key management service (AWS KMS, Azure Key Vault)
- **Option C**: Sync keys across instances

## Troubleshooting

### Error: Failed to initialize keys

**Cause**: Permission issues or disk full

**Solution**:
```bash
# Check permissions
ls -la server/keys/

# Ensure write permissions
chmod 700 server/keys/
```

### Error: JWKS endpoint returns empty keys

**Cause**: Key generation failed

**Solution**: Check logs for errors and ensure `server/keys/` directory exists

### Error: Token signature verification failed

**Cause**: Token signed with old key after rotation

**Solution**: 
- Keep old keys available for a grace period
- Implement key versioning in JWKS endpoint

## Migration from HS256 to RS256

If you're currently using HS256 (symmetric), migrate to RS256 (asymmetric):

1. **Update Discovery**: Already done (RS256 is now primary)
2. **Update Token Generation**: Modify `oauth.service.ts` to use RS256
3. **Gradual Rollout**: Support both algorithms during transition
4. **Client Updates**: Update clients to verify with JWKS

## Best Practices

1. **Never Commit Private Keys**: Always in `.gitignore`
2. **Rotate Regularly**: Quarterly in production
3. **Backup Keys**: Encrypted, off-site storage
4. **Monitor Access**: Log all JWKS endpoint access
5. **Use Strong Keys**: Minimum 2048-bit RSA
6. **Secure Storage**: Encrypt keys at rest in production

## API Reference

### JWKSService

```typescript
import { jwksService } from './services/jwks.service';

// Get private key for signing
const privateKey = jwksService.getPrivateKey();

// Get public key
const publicKey = jwksService.getPublicKey();

// Get key ID
const kid = jwksService.getKeyId();

// Get JWKS for endpoint
const jwks = jwksService.getJWKS();

// Rotate keys
jwksService.rotateKeys();
```

## Testing

### Test JWKS Endpoint
```bash
curl http://localhost:3000/.well-known/jwks.json | jq
```

### Verify Key Format
```bash
# Check private key
openssl rsa -in server/keys/private.pem -check

# Check public key
openssl rsa -in server/keys/public.pem -pubin -text
```

### Test Token Verification
```typescript
import jwt from 'jsonwebtoken';
import { jwksService } from './services/jwks.service';

const token = jwt.sign(
  { sub: 'user123', email: 'user@example.com' },
  jwksService.getPrivateKey(),
  { algorithm: 'RS256', keyid: jwksService.getKeyId() }
);

const decoded = jwt.verify(token, jwksService.getPublicKey());
console.log(decoded);
```

## Compliance

This implementation follows:
- ✅ **RFC 7517**: JSON Web Key (JWK)
- ✅ **RFC 7518**: JSON Web Algorithms (JWA)
- ✅ **RFC 7519**: JSON Web Token (JWT)
- ✅ **OpenID Connect Discovery 1.0**

## Support

For issues or questions:
1. Check logs for `[JWKS]` entries
2. Verify `keys/` directory permissions
3. Test JWKS endpoint manually
4. Review security best practices
