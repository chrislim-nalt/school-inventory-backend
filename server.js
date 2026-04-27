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

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// Existing routes
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

// Initialize cron jobs
scheduleWeeklyReport();
setTimeout(() => {
    checkStartupReport();
}, 5000);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📅 Cron job scheduled: Weekly feeding report every Sunday at 11:59 PM`);
});