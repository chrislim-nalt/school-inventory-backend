const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    unit: { type: String, default: "pcs" },
    assetType: { type: String, enum: ["CONSUMABLE", "NON_CONSUMABLE", "FIXED_ASSET", "LIVESTOCK", "CHEMICAL", "BOOK"], default: "CONSUMABLE" },
    currentQuantity: { type: Number, default: 0 },
    minStockLevel: { type: Number, default: 0 },
    condition: { type: String, default: "Good condition" },
    location: { type: String, default: "Storage" },
    responsiblePerson: { type: String, default: "" },
    dateReceived: { type: Date, default: Date.now },
    serialNumber: { type: String, default: "" },
    model: { type: String, default: "" },
    unitPrice: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    // ADD THIS FIELD
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);