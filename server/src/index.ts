import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';
import { config } from './config/env.js';
import connectDB from './config/db.js';

const PORT = config.PORT;

/**
 * Bootstrap server
 */
async function startServer() {
  try {
    // 1. Connect to Database
    await connectDB();
    console.log('🗄️ Database connected');

    // 2. Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
      console.log(
        `🔧 Email Verification: ${
          config.EMAIL_VERIFICATION ? 'ENABLED' : 'DISABLED'
        }`
      );
    });

    // 3. Handle server startup errors
    server.on('error', (err) => {
      console.error('❌ Server failed to start:', err);
      process.exit(1);
    });

    // 4. Graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`👋 ${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('📴 HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
