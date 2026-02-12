import dotenv from 'dotenv';
dotenv.config();
import { config } from './config/env.js';
import { app } from './app.js';

const PORT = config.PORT;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔧 Email Verification: ${config.EMAIL_VERIFICATION ? 'ENABLED' : 'DISABLED'}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM - Shutting down gracefully');
  server.close(() => {
    console.log('📴 Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT (Ctrl+C) - Shutting down');
  server.close(() => {
    console.log('📴 Server closed');
    process.exit(0);
  });
});

export default server;
