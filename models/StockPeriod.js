const mongoose = require("mongoose");

const stockPeriodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    periodType: { type: String, enum: ["TRIMESTER", "SEMESTER", "ANNUAL", "MONTHLY"], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    academicYear: { type: String, default: "" },
    isActive: { type: Boolean, default: false },
    preparedBy: { type: String, default: "" },
    approvedBy: { type: String, default: "" },
    notes: { type: String, default: "" },
    // ADD THIS FIELD
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
  },
  { timestamps: true }
);

// Update unique index to include school
stockPeriodSchema.index({ name: 1, school: 1 }, { unique: true });

module.exports = mongoose.model("StockPeriod", stockPeriodSchema);