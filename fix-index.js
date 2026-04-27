const mongoose = require("mongoose");

const fixIndex = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect("mongodb://127.0.0.1:27017/inventory");
    console.log("Connected!");
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections({ name: 'trackedassets' }).toArray();
    
    if (collections.length > 0) {
      console.log("Found trackedassets collection");
      
      try {
        await db.collection('trackedassets').dropIndex('transactionNumber_1');
        console.log("✅ Successfully dropped transactionNumber_1 index");
      } catch (err) {
        console.log("Index not found:", err.message);
      }
      
      // List remaining indexes
      const indexes = await db.collection('trackedassets').indexes();
      console.log("Remaining indexes:", indexes.map(i => i.name));
    } else {
      console.log("trackedassets collection doesn't exist yet");
    }
    
    await mongoose.disconnect();
    console.log("Done!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

fixIndex();