const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  createStockRecord,
  getStockRecords,
  getStockRecordById,
  updateStockRecord,
  deleteStockRecord,
  getPeriodSummary,
} = require("../controllers/stockRecordController");

router.post("/", auth, createStockRecord);
router.get("/", auth, getStockRecords);
router.get("/summary/:periodId", auth, getPeriodSummary);
router.get("/:id", auth, getStockRecordById);
router.put("/:id", auth, updateStockRecord);
router.delete("/:id", auth, deleteStockRecord);

module.exports = router;