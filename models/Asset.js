const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    assetType: { type: String, enum: ["FURNITURE", "OFFICE_EQUIPMENT", "KITCHEN_EQUIPMENT", "LAB_EQUIPMENT", "ELECTRONICS", "SPORTS_EQUIPMENT", "LIVESTOCK", "BUILDING", "LAND", "OTHER"], default: "OTHER" },
    quantity: { type: Number, default: 1 },
    condition: { type: String, enum: ["Good condition", "Damaged", "Defective", "Under repair", "New"], default: "Good condition" },
    location: { type: String, default: "Storage" },
    responsiblePerson: { type: String, default: "" },
    dateReceived: { type: Date, default: Date.now },
    unitPrice: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    // ADD THIS FIELD
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Asset", assetSchema);