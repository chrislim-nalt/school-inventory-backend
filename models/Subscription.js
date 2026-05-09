const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true, unique: true },
    plan: {
        type: String,
        enum: ["free_trial", "monthly", "yearly", "lifetime"],
        default: "free_trial"
    },
    status: {
        type: String,
        enum: ["active", "expired", "suspended", "pending"],
        default: "active"
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    amount: { type: Number, default: 0 },
    paymentMethod: { type: String, default: "" },
    paymentReference: { type: String, default: "" },
    features: {
        maxUsers: { type: Number, default: 5 },
        maxStorage: { type: Number, default: 100 },
        allowBorrowing: { type: Boolean, default: true },
        allowReports: { type: Boolean, default: true },
        allowExport: { type: Boolean, default: true },
    },
    notes: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);