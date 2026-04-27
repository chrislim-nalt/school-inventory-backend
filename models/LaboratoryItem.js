const mongoose = require("mongoose");

const laboratoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    itemType: { type: String, enum: ["EQUIPMENT", "CHEMICAL", "GLASSWARE", "CONSUMABLE", "SPECIMEN"], default: "EQUIPMENT" },
    quantity: { type: Number, default: 1 },
    unit: { type: String, enum: ["g", "kg", "ml", "l", "pcs", "pairs", "packs", "boxes"], default: "pcs" },
    condition: { type: String, enum: ["New", "Good", "Fair", "Poor", "Broken", "Needs Calibration"], default: "Good" },
    storageLocation: { type: String, default: "Laboratory" },
    isHazardous: { type: Boolean, default: false },
    expirationDate: { type: Date },
    responsiblePerson: { type: String, default: "" },
    dateReceived: { type: Date, default: Date.now },
    minStockLevel: { type: Number, default: 1 },
    notes: { type: String, default: "" },
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
  },
  { timestamps: true }
);

laboratoryItemSchema.virtual('isExpired').get(function() {
  return this.expirationDate && new Date(this.expirationDate) < new Date();
});

laboratoryItemSchema.set('toJSON', { virtuals: true });
laboratoryItemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("LaboratoryItem", laboratoryItemSchema);