import express from 'express';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import routes from './routes';
import wellKnownRoutes from './routes/well-known.routes';
import { swaggerSpec } from './config/swagger';
import { PrismaClient } from '@prisma/client';

export const app = express();
const prisma = new PrismaClient();

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
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
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
} else if (process.env.NODE_ENV !== 'test') {
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
