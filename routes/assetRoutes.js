const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetSummary,
  getAssetsByLocation,
  getAssetsByType
} = require("../controllers/assetController");

router.get("/", auth, getAssets);
router.get("/summary", auth, getAssetSummary);
router.get("/location/:location", auth, getAssetsByLocation);
router.get("/type/:assetType", auth, getAssetsByType);
router.get("/:id", auth, getAssetById);
router.post("/", auth, createAsset);
router.put("/:id", auth, updateAsset);
router.delete("/:id", auth, deleteAsset);

module.exports = router;