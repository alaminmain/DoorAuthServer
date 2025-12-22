import express from 'express';
import { PrismaClient } from '@prisma/client';
import routes from './routes';
import { Logger } from './utils/Logger';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: 'DoorAuthServer API is running' });
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
});
