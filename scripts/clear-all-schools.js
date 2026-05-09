const mongoose = require("mongoose");
require("dotenv").config();

const clearAllSchools = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/inventory");
        
        // Delete all schools
        const schools = await mongoose.connection.db.collection('schools').deleteMany({});
        console.log(`✅ Deleted ${schools.deletedCount} schools`);
        
        // Delete all non-superadmin users
        const users = await mongoose.connection.db.collection('users').deleteMany({ role: { $ne: "superadmin" } });
        console.log(`✅ Deleted ${users.deletedCount} regular users`);
        
        // Delete all subscriptions
        const subs = await mongoose.connection.db.collection('subscriptions').deleteMany({});
        console.log(`✅ Deleted ${subs.deletedCount} subscriptions`);
        
        console.log("\n🎉 All school data cleared!");
        console.log("Your super admin account remains intact.");
        
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

clearAllSchools();