const mongoose = require("mongoose");

const feedingRecordSchema = new mongoose.Schema({
    itemName: { type: String, required: true, trim: true },
    category: { type: String, enum: ["Grains", "Vegetables", "Fruits", "Proteins", "Dairy", "Beverages", "Oils", "Spices", "Other"], default: "Other" },
    unit: { type: String, enum: ["kg", "g", "l", "ml", "pcs", "bags", "crates", "bottles", "cartons", "sacks"], default: "kg" },
    date: { type: Date, required: true, default: Date.now },
    quantityReceived: { type: Number, default: 0 },
    quantityUsed: { type: Number, default: 0 },
    remainingBalance: { type: Number, default: 0 },
    supplier: { type: String, default: "" },
    receivedBy: { type: String, default: "" },
    purpose: { type: String, enum: ["Breakfast", "Lunch", "Dinner", "Snack", "Special Event", "Emergency", "Other"], default: "Other" },
    reference: { type: String, default: "" },
    notes: { type: String, default: "" },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
}, { timestamps: true });

module.exports = mongoose.model("FeedingRecord", feedingRecordSchema);