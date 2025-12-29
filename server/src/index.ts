import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import routes from './routes';
import wellKnownRoutes from './routes/well-known.routes';
import { Logger } from './utils/Logger';
import { swaggerSpec } from './config/swagger';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;


app.use(cors({
  origin: true, // Allow all origins for demo
  credentials: true // Allow cookies
}));

// Body parsers - MUST support both JSON and form-encoded for OIDC
app.use(express.json()); // For JSON requests
app.use(express.urlencoded({ extended: true })); // For form-encoded requests (OIDC standard)

app.use(cookieParser());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DoorAuthServer API Docs',
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// OpenID Connect Discovery (must be before /api routes)
app.use('/.well-known', wellKnownRoutes);

app.use('/api', routes);

// PROXY CONFIGURATION (For React App)
// In development, proxy all non-API requests to Vite Dev Server
if (process.env.NODE_ENV !== 'production') {
  const { createProxyMiddleware } = require('http-proxy-middleware');

  // Proxy for React App
  app.use('/', createProxyMiddleware({
    target: 'https://localhost:5173',
    changeOrigin: true,
    secure: false, // Accept self-signed certs from Vite
    ws: true, // Enable Websockets for HMR
    logLevel: 'error', // Reduce noise
    pathFilter: (path: string) => {
      // Don't proxy API, Docs, or .well-known
      if (path.startsWith('/api') || path.startsWith('/api-docs') || path.startsWith('/.well-known') || path.startsWith('/health')) {
        return false;
      }
      return true;
    }
  }));
} else {
  // In production, serve static files (placeholder)
  app.get('/', (req, res) => {
    res.json({ message: 'Production static files would be served here' });
  });
}

app.get('/health', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Database connection failed', error);
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Check if SSL certificates exist
// Use process.cwd() instead of __dirname because ts-node runs from src/ but we need project root
const projectRoot = process.cwd();
const certsDir = path.join(projectRoot, 'certs');
const keyPath = path.join(certsDir, 'key.pem');
const certPath = path.join(certsDir, 'cert.pem');

const useHttps = fs.existsSync(keyPath) && fs.existsSync(certPath);

if (useHttps) {
  // HTTPS Server
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };

  https.createServer(httpsOptions, app).listen(PORT, () => {
    Logger.info(`🔒 HTTPS Server is running on port ${PORT}`);
    Logger.info(`📚 API Documentation available at https://localhost:${PORT}/api-docs`);
    Logger.info(`🔐 Using SSL certificates from: ${certsDir}`);
  });
} else {
  // HTTP Server (fallback)
  app.listen(PORT, () => {
    Logger.warn(`⚠️  HTTP Server is running on port ${PORT} (HTTPS certificates not found)`);
    Logger.warn(`   Certificates should be in: ${certsDir}`);
    Logger.warn(`   Run 'npm run generate-certs' to enable HTTPS`);
    Logger.info(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
  });
}
