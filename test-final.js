require("dotenv").config();
const mongoose = require("mongoose");

async function test() {
  console.log("📡 Testing MongoDB Atlas...");
  console.log("URI:", process.env.MONGO_URI?.substring(0, 80) + "...");
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected!");
    
    // Test write
    const db = mongoose.connection.db;
    const testColl = db.collection("test_connection");
    await testColl.insertOne({ test: true, time: new Date() });
    console.log("✅ Test write successful!");
    
    await mongoose.disconnect();
    console.log("✅ All good!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

test();