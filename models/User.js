const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
    role: { type: String, enum: ["admin", "manager", "staff", "viewer"], default: "staff" },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
}, { timestamps: true });

// Compound unique index: email + school (allows same email in different schools)
UserSchema.index({ email: 1, school: 1 }, { unique: true });

module.exports = mongoose.model("User", UserSchema);