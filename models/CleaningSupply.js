const mongoose = require("mongoose");

const cleaningSupplySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      enum: ["kgs", "liters", "pcs", "cartons", "pairs", "bottles", "packs", "l", "kg"],
      default: "pcs",
    },
    minStockLevel: {
      type: Number,
      default: 10,
    },
    storageLocation: {
      type: String,
      default: "Storage Room",
    },
    responsiblePerson: {
      type: String,
      default: "",
    },
    lastRestockedDate: {
      type: Date,
      default: Date.now,
    },
    unitPrice: {
      type: Number,
      default: 0,
    },
    supplier: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    // ADD THIS FIELD - Critical for school isolation
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
  },
  { timestamps: true }
);

// Virtual for status
cleaningSupplySchema.virtual('status').get(function() {
  if (this.quantity <= 0) return "Out of Stock";
  if (this.quantity <= this.minStockLevel) return "Low Stock";
  return "In Stock";
});

cleaningSupplySchema.set('toJSON', { virtuals: true });
cleaningSupplySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("CleaningSupply", cleaningSupplySchema);