const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  createPeriod,
  getAllPeriods,
  getActivePeriod,
  setActivePeriod,
  updatePeriod,
  deletePeriod,
} = require("../controllers/stockPeriodController");

router.post("/", auth, createPeriod);
router.get("/", auth, getAllPeriods);
router.get("/active", auth, getActivePeriod);
router.put("/:id/active", auth, setActivePeriod);
router.put("/:id", auth, updatePeriod);
router.delete("/:id", auth, deletePeriod);

module.exports = router;