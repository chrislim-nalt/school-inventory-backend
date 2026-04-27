const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: { type: String, default: "" },
    userRole: { type: String, default: "" },
    action: {
      type: String,
      enum: [
        "CREATE", "UPDATE", "DELETE", "VIEW", "EXPORT", "IMPORT",
        "STOCK_IN", "STOCK_OUT", "APPROVE", "REJECT", "LOGIN", "LOGOUT",
        "GENERATE_REPORT", "AUDIT", "TRANSFER"
      ],
      required: true,
    },
    modelType: {
      type: String,
      enum: [
        "StockRecord", "ProjectedNeed", "Asset", "CleaningSupply",
        "LaboratoryItem", "LibraryBook", "User", "Category", "StockPeriod"
      ],
      required: true,
    },
    recordId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: String, default: "" },
    beforeState: { type: mongoose.Schema.Types.Mixed },
    afterState: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    status: { type: String, enum: ["SUCCESS", "FAILED", "PENDING"], default: "SUCCESS" },
    errorMessage: { type: String, default: "" },
    // ADD THIS FIELD
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ modelType: 1, recordId: 1 });
activityLogSchema.index({ school: 1 }); // Add index for school

module.exports = mongoose.model("ActivityLog", activityLogSchema);