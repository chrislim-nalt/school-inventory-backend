const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
    getRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    getStockSummary,
    getDashboardStats,
    generateWeeklyReport,
} = require("../controllers/feedingController");

router.get("/records", auth, getRecords);
router.post("/records", auth, createRecord);
router.put("/records/:id", auth, updateRecord);
router.delete("/records/:id", auth, deleteRecord);
router.get("/stock-summary", auth, getStockSummary);
router.get("/dashboard-stats", auth, getDashboardStats);
router.post("/generate-report", auth, generateWeeklyReport);

module.exports = router;