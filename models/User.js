const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, default: "" },
    password: { type: String, required: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School" },
    role: { type: String, enum: ["superadmin", "admin", "manager", "staff", "viewer"], default: "staff" },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    // Security questions for self-recovery
    securityQuestion: { type: String, default: "" },
    securityAnswer: { type: String, default: "" },
    // For password reset
    resetOtp: { type: String, default: null },
    resetOtpExpires: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);