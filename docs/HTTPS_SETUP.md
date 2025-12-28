# HTTPS Configuration for DoorAuth

## Overview

DoorAuth now runs on HTTPS by default to ensure secure communication and proper cookie handling with client applications. This fixes the "Correlation failed" issue that occurs when mixing HTTP and HTTPS protocols in OAuth/OIDC flows.

## Quick Start

### 1. Generate SSL Certificates

```bash
cd server
npm run generate-certs
```

This will create self-signed SSL certificates in the `server/certs/` directory:
- `key.pem` - Private key
- `cert.pem` - Public certificate

### 2. Start the Server

```bash
npm run dev
```

The server will automatically detect the certificates and start in HTTPS mode on port 3000.

You should see:
```
🔒 HTTPS Server is running on port 3000
📚 API Documentation available at https://localhost:3000/api-docs
🔐 Using SSL certificates from: E:\...\server\certs
```

### 3. Trust the Certificate in Your Browser

Since we're using self-signed certificates for development, you'll need to trust them in your browser:

#### Chrome/Edge:
1. Navigate to `https://localhost:3000`
2. Click "Advanced" or "Details"
3. Click "Proceed to localhost (unsafe)" or "Continue to site"
4. The certificate will be trusted for this session

#### Firefox:
1. Navigate to `https://localhost:3000`
2. Click "Advanced"
3. Click "Accept the Risk and Continue"

### 4. Update Client Applications

Make sure your client applications are configured to use HTTPS:

**Client (React/Vite):**
- Already updated to use `https://localhost:3000/api`

**Other Applications:**
- Update the Authority URL to `https://localhost:3000`
- Update redirect URIs if needed

## How It Works

The server (`src/index.ts`) automatically detects if SSL certificates exist:

```typescript
const useHttps = fs.existsSync(keyPath) && fs.existsSync(certPath);

if (useHttps) {
  // Start HTTPS server
  https.createServer(httpsOptions, app).listen(PORT, ...);
} else {
  // Fallback to HTTP with warning
  app.listen(PORT, ...);
}
```

## Troubleshooting

### Certificates Not Found

If you see:
```
⚠️  HTTP Server is running on port 3000 (HTTPS certificates not found)
   Run 'npm run generate-certs' to enable HTTPS
```

Solution: Run `npm run generate-certs` to generate the certificates.

### OpenSSL Not Found

If certificate generation fails with "OpenSSL not found":

**Option 1: Install Git for Windows**
- Download from https://git-scm.com/download/win
- Git includes OpenSSL

**Option 2: Install OpenSSL**
- Download from https://slproweb.com/products/Win32OpenSSL.html
- Install and add to PATH

**Option 3: Manual Generation**
```bash
openssl req -x509 -newkey rsa:2048 -keyout server/certs/key.pem -out server/certs/cert.pem -days 365 -nodes -subj "/CN=localhost"
```

### Browser Still Shows HTTP

1. Clear browser cache and cookies
2. Restart the server
3. Make sure you're accessing `https://localhost:3000` (not `http://`)

### Client Can't Connect

1. Make sure the client is using `https://localhost:3000/api`
2. Trust the certificate in your browser first
3. Check that the server is running in HTTPS mode

## Production Deployment

⚠️ **Important**: Self-signed certificates are for development only!

For production:
1. Obtain a proper SSL certificate from a Certificate Authority (Let's Encrypt, DigiCert, etc.)
2. Replace `certs/key.pem` and `certs/cert.pem` with your production certificates
3. Or use a reverse proxy (nginx, Apache) to handle SSL termination

## Security Notes

- The `certs/` directory is in `.gitignore` - certificates are never committed
- Self-signed certificates provide encryption but not identity verification
- Browsers will show warnings for self-signed certificates
- Always use proper certificates in production

## Files Modified

- `server/src/index.ts` - Added HTTPS support
- `server/scripts/generate-certs.js` - Certificate generation script
- `server/package.json` - Added `generate-certs` script
- `server/.gitignore` - Added `certs/` directory
- `client/src/services/api.ts` - Updated to use HTTPS URL

## Related Documentation

See `docs/CORRELATION_FAILED_SOLUTION.md` for more details on why HTTPS is required for OAuth/OIDC flows.
