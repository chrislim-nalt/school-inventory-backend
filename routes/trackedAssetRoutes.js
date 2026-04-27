const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getTrackedAssets,
  getAssetStats,
  createTrackedAsset,
  updateTrackedAsset,
  deleteTrackedAsset,
  assignAsset,
  returnAsset,
} = require("../controllers/trackedAssetController");

router.get("/", auth, getTrackedAssets);
router.get("/stats", auth, getAssetStats);
router.post("/", auth, createTrackedAsset);
router.put("/:id", auth, updateTrackedAsset);
router.put("/:id/assign", auth, assignAsset);
router.put("/:id/return", auth, returnAsset);
router.delete("/:id", auth, deleteTrackedAsset);

module.exports = router;