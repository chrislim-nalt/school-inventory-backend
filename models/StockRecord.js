const mongoose = require("mongoose");

const stockRecordSchema = new mongoose.Schema(
  {
    period: { type: mongoose.Schema.Types.ObjectId, ref: "StockPeriod", required: true },
    itemName: { type: String, required: true, trim: true },
    itemCategory: { type: String, enum: ["BIVA MUNGANDA", "BITAVA MUNGANDA"], required: true },
    openingStock: { type: Number, required: true, default: 0 },
    usedQuantity: { type: Number, required: true, default: 0 },
    remainingStock: { type: Number, required: true, default: 0 },
    unit: { type: String, enum: ["kgs", "liters", "pcs", "l", "cartons", "pairs", "jerrycan", "bottles"], default: "kgs" },
    unitNote: { type: String, default: "" },
    notes: { type: String, default: "" },
    preparedBy: { type: String, default: "" },
    approvedBy: { type: String, default: "" },
    // ADD THIS FIELD
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
  },
  { timestamps: true }
);

stockRecordSchema.pre('save', function(next) {
  if (this.openingStock && this.usedQuantity) {
    this.remainingStock = this.openingStock - this.usedQuantity;
  }
  next();
});

module.exports = mongoose.model("StockRecord", stockRecordSchema);