const mongoose = require("mongoose");

// Helper function to generate school code
function generateSchoolCode(name) {
    let cleanName = name.replace(/[^a-zA-Z]/g, '');
    let namePart = cleanName.substring(0, 3).toUpperCase();
    while (namePart.length < 3) {
        namePart = namePart + 'X';
    }
    const randomNum = Math.floor(Math.random() * 9000 + 1000);
    return `${namePart}${randomNum}`;
}

const schoolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    schoolCode: {
        type: String,
        unique: true,
        uppercase: true,
        trim: true,
        default: function() {
            return generateSchoolCode(this.name);
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    phone: {
        type: String,
        default: "",
    },
    address: {
        type: String,
        default: "",
    },
    logo: {
        type: String,
        default: "",
    },
    subscription: {
        plan: {
            type: String,
            enum: ["trial", "basic", "premium", "enterprise"],
            default: "trial",
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        endDate: {
            type: Date,
            default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000),
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    settings: {
        allowBorrowing: { type: Boolean, default: true },
        allowStockAlerts: { type: Boolean, default: true },
        maxUsers: { type: Number, default: 10 },
        currency: { type: String, default: "RWF" },
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("School", schoolSchema);