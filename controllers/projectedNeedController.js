const ProjectedNeed = require("../models/ProjectedNeed");
const ActivityLog = require("../models/ActivityLog");

// Create projected need
exports.createProjectedNeed = async (req, res) => {
  try {
    const need = new ProjectedNeed(req.body);
    await need.save();
    
    await ActivityLog.create({
      userId: req.user?._id,
      userName: req.user?.name,
      action: "CREATE",
      modelType: "ProjectedNeed",
      recordId: need._id,
      details: `Created projected need for ${need.itemName}`,
      status: "SUCCESS"
    });
    
    res.status(201).json({ success: true, data: need });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get all projected needs
exports.getProjectedNeeds = async (req, res) => {
  try {
    const { period, itemCategory } = req.query;
    let filter = {};
    
    if (period) filter.period = period;
    if (itemCategory) filter.itemCategory = itemCategory;
    
    const needs = await ProjectedNeed.find(filter).populate('period');
    res.status(200).json({ success: true, data: needs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update projected need
exports.updateProjectedNeed = async (req, res) => {
  try {
    const need = await ProjectedNeed.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: need });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete projected need
exports.deleteProjectedNeed = async (req, res) => {
  try {
    await ProjectedNeed.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Projected need deleted" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};