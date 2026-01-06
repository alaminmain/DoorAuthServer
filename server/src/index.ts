import https from 'https';
import fs from 'fs';
import path from 'path';
import { app } from './app';
import { Logger } from './utils/Logger';

const PORT = process.env.PORT || 3000;

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

