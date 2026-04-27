const cron = require("node-cron");
const FeedingRecord = require("./models/FeedingRecord");

// Auto generate weekly report
const autoGenerateWeeklyReport = async () => {
    try {
        const weekEnd = new Date();
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        weekStart.setUTCHours(0, 0, 0, 0);
        weekEnd.setUTCHours(23, 59, 59, 999);
        
        const records = await FeedingRecord.find({
            date: { $gte: weekStart, $lte: weekEnd }
        });
        
        const grouped = {};
        records.forEach(record => {
            if (!grouped[record.itemName]) {
                grouped[record.itemName] = {
                    itemName: record.itemName,
                    unit: record.unit,
                    totalReceived: 0,
                    totalUsed: 0,
                };
            }
            grouped[record.itemName].totalReceived += record.quantityReceived || 0;
            grouped[record.itemName].totalUsed += record.quantityUsed || 0;
        });
        
        console.log(`✅ Auto-generated weekly report for week starting ${weekStart.toDateString()}`);
        console.log(`📊 Total items: ${Object.keys(grouped).length}`);
        
        return { success: true };
    } catch (error) {
        console.error("❌ Auto-generate report error:", error);
        return { success: false, error: error.message };
    }
};

// Schedule weekly report every Sunday at 11:59 PM
const scheduleWeeklyReport = () => {
    cron.schedule("59 23 * * 0", async () => {
        console.log("=".repeat(50));
        console.log(`🕐 CRON JOB TRIGGERED: ${new Date().toLocaleString()}`);
        console.log("Generating weekly feeding report...");
        
        await autoGenerateWeeklyReport();
        
        console.log("=".repeat(50));
    });
    
    console.log("📅 Cron job scheduled: Weekly feeding report every Sunday at 11:59 PM");
};

// Check if report needs to be generated on startup
const checkStartupReport = async () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    
    if (dayOfWeek === 0 && (hour === 23 || hour === 0 || hour === 1)) {
        console.log("🔄 Server started near report time. Generating weekly report...");
        await autoGenerateWeeklyReport();
    }
};

module.exports = { scheduleWeeklyReport, checkStartupReport, autoGenerateWeeklyReport };