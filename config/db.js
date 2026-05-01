const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      console.error("❌ MONGO_URI is not defined in environment variables");
      process.exit(1);
    }
    
    console.log("📡 Connecting to MongoDB...");
    
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
    };
    
    await mongoose.connect(mongoURI, options);
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    
    // Handle connection errors after initial connection
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
    });
    
    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected, attempting to reconnect...");
    });
    
    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
    });
    
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.log("🔄 Retrying connection in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;