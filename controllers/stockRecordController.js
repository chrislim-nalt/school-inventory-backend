const StockRecord = require("../models/StockRecord");
const StockPeriod = require("../models/StockPeriod");
const ActivityLog = require("../models/ActivityLog");

// Create stock record
exports.createStockRecord = async (req, res) => {
  try {
    const record = new StockRecord(req.body);
    await record.save();
    
    await ActivityLog.create({
      userId: req.user?._id,
      userName: req.user?.name,
      action: "CREATE",
      modelType: "StockRecord",
      recordId: record._id,
      details: `Created stock record for ${record.itemName}`,
      status: "SUCCESS"
    });
    
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get all stock records with optional filters
exports.getStockRecords = async (req, res) => {
  try {
    const { period, itemCategory, itemName } = req.query;
    let filter = {};
    
    if (period) filter.period = period;
    if (itemCategory) filter.itemCategory = itemCategory;
    if (itemName) filter.itemName = { $regex: itemName, $options: 'i' };
    
    const records = await StockRecord.find(filter).populate('period');
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get stock record by ID
exports.getStockRecordById = async (req, res) => {
  try {
    const record = await StockRecord.findById(req.params.id).populate('period');
    if (!record) {
      return res.status(404).json({ success: false, error: "Record not found" });
    }
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update stock record
exports.updateStockRecord = async (req, res) => {
  try {
    const record = await StockRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete stock record
exports.deleteStockRecord = async (req, res) => {
  try {
    await StockRecord.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Record deleted" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get summary for a period (BIVA MUNGANDA vs BITAVA MUNGANDA)
exports.getPeriodSummary = async (req, res) => {
  try {
    const { periodId } = req.params;
    
    const bivaSummary = await StockRecord.aggregate([
      { $match: { period: mongoose.Types.ObjectId(periodId), itemCategory: "BIVA MUNGANDA" } },
      { $group: {
          _id: null,
          totalOpening: { $sum: "$openingStock" },
          totalUsed: { $sum: "$usedQuantity" },
          totalRemaining: { $sum: "$remainingStock" }
        }
      }
    ]);
    
    const bitavaSummary = await StockRecord.aggregate([
      { $match: { period: mongoose.Types.ObjectId(periodId), itemCategory: "BITAVA MUNGANDA" } },
      { $group: {
          _id: null,
          totalOpening: { $sum: "$openingStock" },
          totalUsed: { $sum: "$usedQuantity" },
          totalRemaining: { $sum: "$remainingStock" }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        bivaMuganda: bivaSummary[0] || { totalOpening: 0, totalUsed: 0, totalRemaining: 0 },
        bitavaMuganda: bitavaSummary[0] || { totalOpening: 0, totalUsed: 0, totalRemaining: 0 }
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};