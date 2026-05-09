const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { scheduleWeeklyReport, checkStartupReport } = require("./cronJobs");

dotenv.config();
connectDB();

const app = express();

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
    uptime: process.uptime()
  });
});

// ==================== KEEP-ALIVE FUNCTIONALITY ====================

// Self-ping to keep the service awake (only in production)
if (process.env.NODE_ENV === "production") {
  const keepAlive = async () => {
    const url = `https://${process.env.RENDER_SERVICE_NAME || "school-inventory-backend"}.onrender.com/health`;
    try {
      const response = await fetch(url);
      console.log(`✅ Keep-alive ping sent at ${new Date().toLocaleTimeString()}: ${response.status}`);
    } catch (err) {
      console.log(`❌ Keep-alive ping failed: ${err.message}`);
    }
  };
  
  // Ping every 10 minutes (600,000 ms) to keep the service awake
  setInterval(keepAlive, 600000);
  console.log("⏰ Keep-alive ping scheduled every 10 minutes");
}

// ==================== ROOT ENDPOINT ====================

app.get("/", (req, res) => {
  res.json({
    name: "School Inventory Management System",
    version: "1.0.0",
    status: "running",
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

// NEW ADMIN ROUTE (ADDED)
app.use("/api/admin", require("./routes/adminRoutes"));

// ==================== 404 HANDLER ====================

app.use((req, res) => {
  res.status(404).json({ 
    message: "Route not found",
    requestedUrl: req.originalUrl
  });
});

// ==================== ERROR HANDLING MIDDLEWARE ====================

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ 
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// ==================== CRON JOBS ====================

// Initialize cron jobs
scheduleWeeklyReport();
setTimeout(() => {
    checkStartupReport();
}, 5000);

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📅 Cron job scheduled: Weekly feeding report every Sunday at 11:59 PM`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});