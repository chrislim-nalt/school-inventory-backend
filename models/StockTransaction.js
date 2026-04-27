const mongoose = require("mongoose");

const stockTransactionSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    type: { type: String, enum: ["IN", "OUT", "BORROW", "RETURN"], required: true },
    quantity: { type: Number, required: true, min: 1 },
    date: { type: Date, default: Date.now },
    reference: { type: String, default: "" },
    purpose: { type: String, default: "" },
    borrowerName: { type: String, default: "" },
    borrowerDepartment: { type: String, default: "" },
    expectedReturnDate: { type: Date },
    actualReturnDate: { type: Date },
    status: { type: String, enum: ["BORROWED", "RETURNED", "OVERDUE"], default: "BORROWED" },
    performedBy: { type: String, default: "System" },
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockTransaction", stockTransactionSchema);