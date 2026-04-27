const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getCleaningSupplies,
  createCleaningSupply,
  updateCleaningSupply,
  deleteCleaningSupply,
  getLowStockSupplies,
  updateStock,
} = require("../controllers/cleaningSupplyController");

router.get("/", auth, getCleaningSupplies);
router.get("/low-stock", auth, getLowStockSupplies);
router.post("/", auth, createCleaningSupply);
router.put("/:id", auth, updateCleaningSupply);
router.put("/:id/stock", auth, updateStock);
router.delete("/:id", auth, deleteCleaningSupply);

module.exports = router;