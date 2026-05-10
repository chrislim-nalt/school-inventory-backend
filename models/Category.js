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
    school: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "School",
      // Not required for super admin, but required for school users
    },
  },
  { timestamps: true }
);

// Create compound unique index for name + school
categorySchema.index({ name: 1, school: 1 }, { unique: true, partialFilterExpression: { school: { $exists: true } } });

module.exports = mongoose.model("Category", categorySchema);