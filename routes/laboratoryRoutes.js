const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getLaboratoryItems,
  createLaboratoryItem,
  updateLaboratoryItem,
  deleteLaboratoryItem,
  getExpiredChemicals,
  getLowStockLabItems,
} = require("../controllers/laboratoryController");

router.get("/", auth, getLaboratoryItems);
router.get("/expired", auth, getExpiredChemicals);
router.get("/low-stock", auth, getLowStockLabItems);
router.post("/", auth, createLaboratoryItem);
router.put("/:id", auth, updateLaboratoryItem);
router.delete("/:id", auth, deleteLaboratoryItem);

module.exports = router;