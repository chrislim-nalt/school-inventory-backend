const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
require("dotenv").config();

async function createSuperAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/inventory");
        console.log("✅ Connected to MongoDB");
        
        // DELETE existing super admin first
        const deleted = await User.deleteMany({ role: "superadmin" });
        console.log(`🗑️ Deleted ${deleted.deletedCount} existing super admin(s)`);
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("Admin123!", salt);
        
        const admin = new User({
            name: "Super Administrator",
            email: "admin@system.com",
            password: hashedPassword,
            role: "superadmin",
            isActive: true,
        });
        await admin.save();
        
        console.log("\n✅ SUPER ADMIN CREATED!");
        console.log("📧 Email: admin@system.com");
        console.log("🔑 Password: Admin123!");
        console.log("========================\n");
        
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

createSuperAdmin();