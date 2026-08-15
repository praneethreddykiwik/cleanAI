import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { SocketService } from './config/socket';
import { initEventBusListeners } from './utils/listeners';
import { EnvValidator } from './config/env.validation';

// Assert Env config variables before starting server
EnvValidator.validate();

const app = createApp();

// Initialize Event Bus Listeners
initEventBusListeners();

// Spin up persistent HTTP + Socket.IO server in local development mode
if (!process.env.VERCEL) {
  const PORT = env.PORT || 4000;
  const server = http.createServer(app);

  // Initialize Sockets Service
  SocketService.init(server);

  server.listen(PORT, () => {
    logger.info(`⚡️[server]: Server is running at http://localhost:${PORT} in ${env.NODE_ENV} mode`);
  });

  const gracefulShutdown = () => {
    logger.info('Stopping server...');
    server.close(() => {
      logger.info('Server stopped.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

export default app;
