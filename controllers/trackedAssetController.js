const TrackedAsset = require("../models/TrackedAsset");

// Get all assets (filtered by school)
exports.getTrackedAssets = async (req, res) => {
  try {
    const assets = await TrackedAsset.find({ school: req.user.schoolId })
      .sort({ createdAt: -1 });
    res.json(assets);
  } catch (error) {
    console.error("Get assets error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get stats (filtered by school)
exports.getAssetStats = async (req, res) => {
  try {
    const total = await TrackedAsset.countDocuments({ school: req.user.schoolId });
    const good = await TrackedAsset.countDocuments({ 
      school: req.user.schoolId, 
      condition: "Good" 
    });
    const fair = await TrackedAsset.countDocuments({ 
      school: req.user.schoolId, 
      condition: "Fair" 
    });
    const poor = await TrackedAsset.countDocuments({ 
      school: req.user.schoolId, 
      condition: "Poor" 
    });
    const damaged = await TrackedAsset.countDocuments({ 
      school: req.user.schoolId, 
      condition: "Damaged" 
    });
    const underRepair = await TrackedAsset.countDocuments({ 
      school: req.user.schoolId, 
      condition: "Under Repair" 
    });
    const available = await TrackedAsset.countDocuments({ 
      school: req.user.schoolId, 
      status: "Available" 
    });
    const assigned = await TrackedAsset.countDocuments({ 
      school: req.user.schoolId, 
      status: "Assigned" 
    });
    
    res.json({ total, good, fair, poor, damaged, underRepair, available, assigned });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create asset - ADD SCHOOL ID HERE
exports.createTrackedAsset = async (req, res) => {
  try {
    const { assetName, assetCode, serialNumber, condition } = req.body;
    
    console.log("Creating asset for school:", req.user.schoolId);
    
    const asset = new TrackedAsset({
      assetName,
      assetCode,
      serialNumber,
      condition: condition || "Good",
      school: req.user.schoolId  // ← CRITICAL: Add school ID here
    });
    
    await asset.save();
    console.log("Asset created:", asset);
    res.status(201).json(asset);
  } catch (error) {
    console.error("Create asset error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update asset (verify school ownership)
exports.updateTrackedAsset = async (req, res) => {
  try {
    const asset = await TrackedAsset.findOneAndUpdate(
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

// Delete asset (verify school ownership)
exports.deleteTrackedAsset = async (req, res) => {
  try {
    const asset = await TrackedAsset.findOneAndDelete({ 
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

// Assign asset (verify school ownership)
exports.assignAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo, location } = req.body;
    
    const asset = await TrackedAsset.findOne({ 
      _id: id, 
      school: req.user.schoolId 
    });
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    
    asset.assignedTo = assignedTo;
    asset.location = location || asset.location;
    asset.status = "Assigned";
    await asset.save();
    
    res.json(asset);
  } catch (error) {
    console.error("Assign asset error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Return asset (verify school ownership)
exports.returnAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await TrackedAsset.findOne({ 
      _id: id, 
      school: req.user.schoolId 
    });
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    
    asset.assignedTo = "";
    asset.status = "Available";
    await asset.save();
    
    res.json(asset);
  } catch (error) {
    console.error("Return asset error:", error);
    res.status(500).json({ message: error.message });
  }
};