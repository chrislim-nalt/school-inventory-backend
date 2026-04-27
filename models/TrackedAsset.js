const mongoose = require("mongoose");

const trackedAssetSchema = new mongoose.Schema(
  {
    assetName: { type: String, required: true, trim: true },
    assetCode: { type: String, required: true, trim: true },
    serialNumber: { type: String, required: true, trim: true },
    condition: { type: String, default: "Good" },
    status: { type: String, default: "Available" },
    assignedTo: { type: String, default: "" },
    location: { type: String, default: "Storage" },
    notes: { type: String, default: "" },
    // ADD THIS FIELD - CRITICAL FOR DATA ISOLATION
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TrackedAsset", trackedAssetSchema);