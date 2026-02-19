import mongoose from "mongoose";
import { config } from "./env.js";

const connectDB = async (): Promise<void> => {
  try {
    // Connection options for better reliability
    const connOptions = {
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5s
      socketTimeoutMS: 45000,        // Close sockets after 45s of inactivity
      family: 4,                     // Use IPv4 only
      maxPoolSize: 10,               // Maintain up to 10 socket connections
    };

    if (!process.env.MONGODB_URI) {
        console.log('MONGODB_URI:', config.MONGODB_URI);
  throw new Error("❌ MONGODB_URI is missing in .env");
}

    await mongoose.connect(config.MONGODB_URI, connOptions);
    
    console.log("✅ MongoDB connected successfully");
    
    // Handle connection events after successful connection
    mongoose.connection.on('connected', () => {
      console.log("📡 Mongoose connected to MongoDB");
    });

    mongoose.connection.on('error', (err) => {
      console.error("❌ Mongoose connection error:", err.message);
    });

  } catch (error: any) {
    console.error("💥 MongoDB connection failed:", error.message);
    
    // Exit process on connection failure (adjust as needed for your app)
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log("🛑 Gracefully shutting down...");
  await mongoose.connection.close();
  console.log("📴 MongoDB connection closed");
  process.exit(0);
});

export default connectDB;
