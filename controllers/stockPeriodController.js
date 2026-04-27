const StockPeriod = require("../models/StockPeriod");
const ActivityLog = require("../models/ActivityLog");

// Create a new stock period
exports.createPeriod = async (req, res) => {
  try {
    const period = new StockPeriod(req.body);
    await period.save();
    
    // Log activity
    await ActivityLog.create({
      userId: req.user?._id,
      userName: req.user?.name,
      action: "CREATE",
      modelType: "StockPeriod",
      recordId: period._id,
      details: `Created stock period: ${period.name}`,
      status: "SUCCESS"
    });
    
    res.status(201).json({ success: true, data: period });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get all periods
exports.getAllPeriods = async (req, res) => {
  try {
    const periods = await StockPeriod.find().sort({ startDate: -1 });
    res.status(200).json({ success: true, data: periods });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get active period
exports.getActivePeriod = async (req, res) => {
  try {
    const period = await StockPeriod.findOne({ isActive: true });
    res.status(200).json({ success: true, data: period });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Set active period
exports.setActivePeriod = async (req, res) => {
  try {
    await StockPeriod.updateMany({}, { isActive: false });
    const period = await StockPeriod.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );
    res.status(200).json({ success: true, data: period });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update period
exports.updatePeriod = async (req, res) => {
  try {
    const period = await StockPeriod.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: period });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete period
exports.deletePeriod = async (req, res) => {
  try {
    await StockPeriod.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Period deleted" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};