const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    categoryType: { type: String, enum: ["CONSUMABLE_FOOD", "CONSUMABLE_NON_FOOD", "EQUIPMENT_OFFICE", "EQUIPMENT_KITCHEN", "EQUIPMENT_LAB", "EQUIPMENT_SPORTS", "EQUIPMENT_TECH", "FURNITURE", "BOOKS", "CHEMICALS", "LIVESTOCK", "FIXED_ASSET", "OTHER"], default: "OTHER" },
    icon: { type: String, default: "📦" },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    // ADD THIS FIELD
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
  },
  { timestamps: true }
);

// Update unique index to include school (name can be same across different schools)
categorySchema.index({ name: 1, school: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);