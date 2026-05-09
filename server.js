const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { scheduleWeeklyReport, checkStartupReport } = require("./cronJobs");

// Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

dotenv.config();

// Import fetch for Node.js < 18 compatibility
let fetch;
if (!globalThis.fetch) {
  try {
    fetch = require("node-fetch");
  } catch (err) {
    console.warn("⚠️ node-fetch not installed. Keep-alive will use global fetch if available.");
    fetch = globalThis.fetch || null;
  }
} else {
  fetch = globalThis.fetch;
}

// Connect to database and initialize server only after DB is ready
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ Database connected successfully");

    const app = express();
    const PORT = process.env.PORT || 5000;

    app.use(cors());
    app.use(express.json());

    // ==================== HEALTH CHECK ENDPOINTS ====================

    // Simple health check
    app.get("/health", (req, res) => {
      res.status(200).json({
        status: "ok",
        message: "Server is running",
        timestamp: new Date().toISOString()
      });
    });

    // Detailed health check with database status
    app.get("/health/detailed", async (req, res) => {
      const mongoose = require("mongoose");
      const dbState = mongoose.connection.readyState;
      const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting"
      };

      res.status(200).json({
        status: "ok",
        server: "running",
        database: states[dbState] || "unknown",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      });
    });

    // ==================== KEEP-ALIVE FUNCTIONALITY ====================

    // Self-ping to keep the service awake (only in production)
    if (process.env.NODE_ENV === "production" && fetch) {
      const keepAlive = async () => {
        const baseUrl = process.env.KEEP_ALIVE_URL || 
                       `https://${process.env.RENDER_SERVICE_NAME || "school-inventory-backend"}.onrender.com`;
        const url = `${baseUrl}/health`;
        
        try {
          const response = await fetch(url);
          console.log(`✅ Keep-alive ping sent at ${new Date().toLocaleTimeString()}: ${response.status}`);
        } catch (err) {
          console.log(`❌ Keep-alive ping failed: ${err.message}`);
        }
      };

      // Ping every 10 minutes (600,000 ms) to keep the service awake
      setInterval(keepAlive, 600000);
      // Send initial ping after 1 minute
      setTimeout(keepAlive, 60000);
      console.log("⏰ Keep-alive ping scheduled every 10 minutes");
    } else if (process.env.NODE_ENV === "production" && !fetch) {
      console.warn("⚠️ Fetch not available. Keep-alive functionality disabled.");
    }

    // ==================== ROOT ENDPOINT ====================

    app.get("/", (req, res) => {
      res.json({
        name: "School Inventory Management System",
        version: "1.0.0",
        status: "running",
        environment: process.env.NODE_ENV || "development",
        endpoints: {
          health: "/health",
          detailedHealth: "/health/detailed",
          api: "/api"
        }
      });
    });

    // ==================== API ROUTES ====================

    // EXISTING ROUTES (ALL PRESERVED)
    app.use("/api/stock", require("./routes/stockRoutes"));
    app.use("/api/categories", require("./routes/categoryRoutes"));
    app.use("/api/items", require("./routes/itemRoutes"));
    app.use("/api/auth", require("./routes/auth"));
    app.use("/api/feeding", require("./routes/feedingRoutes"));
    app.use("/api/stock-periods", require("./routes/stockPeriodRoutes"));
    app.use("/api/stock-records", require("./routes/stockRecordRoutes"));
    app.use("/api/tracked-assets", require("./routes/trackedAssetRoutes"));
    app.use("/api/projected-needs", require("./routes/projectedNeedRoutes"));
    app.use("/api/assets", require("./routes/assetRoutes"));
    app.use("/api/cleaning-supplies", require("./routes/cleaningSupplyRoutes"));
    app.use("/api/laboratory", require("./routes/laboratoryRoutes"));
    app.use("/api/library", require("./routes/libraryRoutes"));
    app.use("/api/admin", require("./routes/adminRoutes"));

    // ==================== 404 HANDLER ====================

    app.use((req, res) => {
      res.status(404).json({
        message: "Route not found",
        requestedUrl: req.originalUrl,
        method: req.method
      });
    });

    // ==================== ERROR HANDLING MIDDLEWARE ====================

    app.use((err, req, res, next) => {
      console.error("Error:", err.message);
      console.error("Stack:", err.stack);
      res.status(500).json({
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? err.message : undefined
      });
    });

    // ==================== CRON JOBS ====================

    // Initialize cron jobs after DB is connected
    scheduleWeeklyReport();
    console.log("📅 Weekly feeding report scheduled: Every Sunday at 11:59 PM");
    
    // Check for startup report after 5 seconds
    setTimeout(() => {
      checkStartupReport();
    }, 5000);

    // ==================== START SERVER ====================

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📍 Detailed health check: http://localhost:${PORT}/health/detailed`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      console.log("Received shutdown signal, closing server gracefully...");
      server.close(() => {
        console.log("Server closed successfully");
        // Close database connection
        const mongoose = require("mongoose");
        mongoose.connection.close(false, () => {
          console.log("Database connection closed");
          process.exit(0);
        });
      });

      // Force shutdown after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        console.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();