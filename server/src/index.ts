import express from 'express';
import { PrismaClient } from '@prisma/client';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { Logger } from './utils/Logger';
import { swaggerSpec } from './config/swagger';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    message: 'DoorAuthServer API is running',
    documentation: '/api-docs',
    version: '1.0.0',
  });
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Database connection failed', error);
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

app.listen(PORT, () => {
  Logger.info(`Server is running on port ${PORT}`);
  Logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
});
