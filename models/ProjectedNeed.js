const mongoose = require("mongoose");

const projectedNeedSchema = new mongoose.Schema(
  {
    period: { type: mongoose.Schema.Types.ObjectId, ref: "StockPeriod", required: true },
    itemName: { type: String, required: true, trim: true },
    itemCategory: { type: String, enum: ["BIVA MUNGANDA", "BITAVA MUNGANDA"], required: true },
    projectedQuantity: { type: Number, required: true },
    unit: { type: String, enum: ["kgs", "liters", "pcs", "l", "cartons", "pairs", "jerrycan", "bottles", "RWF"], default: "kgs" },
    basedOnPreviousPeriod: { type: mongoose.Schema.Types.ObjectId, ref: "StockRecord", default: null },
    priority: { type: String, enum: ["HIGH", "MEDIUM", "LOW"], default: "MEDIUM" },
    notes: { type: String, default: "" },
    preparedBy: { type: String, default: "" },
    approvedBy: { type: String, default: "" },
    // ADD THIS FIELD
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProjectedNeed", projectedNeedSchema);