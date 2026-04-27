const Asset = require("../models/Asset");

// Get all assets (filtered by school)
exports.getAssets = async (req, res) => {
  try {
    const assets = await Asset.find({ school: req.user.schoolId })
      .sort({ createdAt: -1 });
    res.json(assets);
  } catch (error) {
    console.error("Get assets error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get single asset
exports.getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findOne({ 
      _id: req.params.id, 
      school: req.user.schoolId 
    });
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    res.json(asset);
  } catch (error) {
    console.error("Get asset error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create asset
exports.createAsset = async (req, res) => {
  try {
    console.log("Creating asset for school:", req.user.schoolId);
    
    const asset = new Asset({
      ...req.body,
      school: req.user.schoolId  // ← CRITICAL: Add school ID
    });
    
    await asset.save();
    res.status(201).json(asset);
  } catch (error) {
    console.error("Create asset error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update asset
exports.updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, school: req.user.schoolId },
      req.body,
      { new: true }
    );
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    res.json(asset);
  } catch (error) {
    console.error("Update asset error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete asset
exports.deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findOneAndDelete({ 
      _id: req.params.id, 
      school: req.user.schoolId 
    });
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    res.json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error("Delete asset error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get asset summary (filtered by school)
exports.getAssetSummary = async (req, res) => {
  try {
    const total = await Asset.countDocuments({ school: req.user.schoolId });
    const byCondition = await Asset.aggregate([
      { $match: { school: req.user.schoolId } },
      { $group: { _id: "$condition", count: { $sum: 1 } } }
    ]);
    const byType = await Asset.aggregate([
      { $match: { school: req.user.schoolId } },
      { $group: { _id: "$assetType", count: { $sum: 1 } } }
    ]);
    res.json({ total, byCondition, byType });
  } catch (error) {
    console.error("Asset summary error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get assets by location
exports.getAssetsByLocation = async (req, res) => {
  try {
    const assets = await Asset.find({ 
      location: req.params.location,
      school: req.user.schoolId 
    });
    res.json(assets);
  } catch (error) {
    console.error("Get assets by location error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get assets by type
exports.getAssetsByType = async (req, res) => {
  try {
    const assets = await Asset.find({ 
      assetType: req.params.assetType,
      school: req.user.schoolId 
    });
    res.json(assets);
  } catch (error) {
    console.error("Get assets by type error:", error);
    res.status(500).json({ message: error.message });
  }
};