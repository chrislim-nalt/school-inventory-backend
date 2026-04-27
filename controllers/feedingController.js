const FeedingRecord = require("../models/FeedingRecord");

// Get all records (filtered by school)
exports.getRecords = async (req, res) => {
    try {
        const records = await FeedingRecord.find({ school: req.user.schoolId })
            .populate("recordedBy", "name")
            .sort({ date: -1 });
        res.json(records);
    } catch (error) {
        console.error("Get records error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Create new record (automatically adds school ID)
exports.createRecord = async (req, res) => {
    try {
        console.log("Received data:", req.body);
        console.log("Creating record for school:", req.user.schoolId);
        
        const { 
            itemName, category, unit, date, quantityReceived, quantityUsed, 
            supplier, receivedBy, purpose, reference, notes 
        } = req.body;
        
        if (!itemName) {
            return res.status(400).json({ message: "Item name is required" });
        }
        
        // Calculate remaining balance (only from same school)
        const previousRecord = await FeedingRecord.findOne({ 
            itemName: itemName,
            school: req.user.schoolId
        }).sort({ date: -1 });
        
        const previousBalance = previousRecord ? previousRecord.remainingBalance : 0;
        const received = parseFloat(quantityReceived) || 0;
        const used = parseFloat(quantityUsed) || 0;
        const remainingBalance = previousBalance + received - used;
        
        // Fix date timezone
        let recordDate;
        if (date) {
            recordDate = new Date(date);
            recordDate.setUTCHours(0, 0, 0, 0);
        } else {
            recordDate = new Date();
            recordDate.setUTCHours(0, 0, 0, 0);
        }
        
        const record = new FeedingRecord({
            itemName,
            category: category || "Other",
            unit: unit || "kg",
            date: recordDate,
            quantityReceived: received,
            quantityUsed: used,
            remainingBalance: remainingBalance,
            supplier: supplier || "",
            receivedBy: receivedBy || "",
            purpose: purpose || "Other",
            reference: reference || "",
            notes: notes || "",
            recordedBy: req.user.id,
            school: req.user.schoolId
        });
        
        await record.save();
        
        const populatedRecord = await FeedingRecord.findById(record._id)
            .populate("recordedBy", "name");
        
        console.log("Record created successfully");
        res.status(201).json(populatedRecord);
    } catch (error) {
        console.error("Create record error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Update record (verify school ownership)
exports.updateRecord = async (req, res) => {
    try {
        const { date, ...otherFields } = req.body;
        
        let updateData = { ...otherFields };
        if (date) {
            const fixedDate = new Date(date);
            fixedDate.setUTCHours(0, 0, 0, 0);
            updateData.date = fixedDate;
        }
        
        const record = await FeedingRecord.findOneAndUpdate(
            { _id: req.params.id, school: req.user.schoolId },
            updateData,
            { new: true }
        ).populate("recordedBy", "name");
        
        if (!record) {
            return res.status(404).json({ message: "Record not found" });
        }
        
        // Recalculate balance for this and all subsequent records (same school)
        const allRecords = await FeedingRecord.find({ 
            itemName: record.itemName,
            school: req.user.schoolId,
            date: { $gte: record.date }
        }).sort({ date: 1 });
        
        let balance = 0;
        for (const r of allRecords) {
            balance = balance + (r.quantityReceived || 0) - (r.quantityUsed || 0);
            r.remainingBalance = balance;
            await r.save();
        }
        
        res.json(record);
    } catch (error) {
        console.error("Update record error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Delete record (verify school ownership)
exports.deleteRecord = async (req, res) => {
    try {
        const record = await FeedingRecord.findOneAndDelete({ 
            _id: req.params.id, 
            school: req.user.schoolId 
        });
        if (!record) {
            return res.status(404).json({ message: "Record not found" });
        }
        
        // Recalculate balance for remaining records (same school)
        const remainingRecords = await FeedingRecord.find({ 
            itemName: record.itemName,
            school: req.user.schoolId
        }).sort({ date: 1 });
        
        let balance = 0;
        for (const r of remainingRecords) {
            balance = balance + (r.quantityReceived || 0) - (r.quantityUsed || 0);
            r.remainingBalance = balance;
            await r.save();
        }
        
        res.json({ message: "Record deleted successfully" });
    } catch (error) {
        console.error("Delete record error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get stock summary (grouped by item, filtered by school)
exports.getStockSummary = async (req, res) => {
    try {
        const items = await FeedingRecord.aggregate([
            { $match: { school: req.user.schoolId } },
            { $sort: { date: -1 } },
            { $group: {
                _id: "$itemName",
                unit: { $first: "$unit" },
                category: { $first: "$category" },
                currentBalance: { $first: "$remainingBalance" },
                lastUpdated: { $first: "$date" }
            }}
        ]);
        
        res.json(items.map(item => ({
            itemName: item._id,
            category: item.category,
            unit: item.unit,
            currentBalance: item.currentBalance || 0,
            lastUpdated: item.lastUpdated
        })));
    } catch (error) {
        console.error("Stock summary error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get dashboard statistics (filtered by school)
exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        
        const todayRecords = await FeedingRecord.find({
            school: req.user.schoolId,
            date: { $gte: today, $lt: tomorrow }
        });
        
        const todayReceived = todayRecords.reduce((sum, r) => sum + (r.quantityReceived || 0), 0);
        const todayUsed = todayRecords.reduce((sum, r) => sum + (r.quantityUsed || 0), 0);
        
        const uniqueItems = await FeedingRecord.distinct("itemName", { school: req.user.schoolId });
        
        const lowStockItems = [];
        for (const itemName of uniqueItems) {
            const latest = await FeedingRecord.findOne({ 
                itemName, 
                school: req.user.schoolId 
            }).sort({ date: -1 });
            if (latest && latest.remainingBalance < 10) {
                lowStockItems.push({ 
                    itemName, 
                    balance: latest.remainingBalance, 
                    unit: latest.unit 
                });
            }
        }
        
        res.json({
            totalItems: uniqueItems.length,
            todayReceived,
            todayUsed,
            lowStockCount: lowStockItems.length,
            lowStockItems,
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Generate weekly report (filtered by school)
exports.generateWeeklyReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        
        let weekStart = startDate ? new Date(startDate) : new Date();
        let weekEnd = endDate ? new Date(endDate) : new Date();
        
        if (!startDate) {
            weekEnd = new Date();
            weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - 7);
        }
        
        weekStart.setUTCHours(0, 0, 0, 0);
        weekEnd.setUTCHours(23, 59, 59, 999);
        
        const records = await FeedingRecord.find({
            school: req.user.schoolId,
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
        
        const reportData = Object.values(grouped);
        
        res.json({
            period: { start: weekStart, end: weekEnd },
            records: reportData,
            summary: {
                totalItems: reportData.length,
                totalReceived: reportData.reduce((sum, r) => sum + r.totalReceived, 0),
                totalUsed: reportData.reduce((sum, r) => sum + r.totalUsed, 0),
            }
        });
    } catch (error) {
        console.error("Generate report error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Auto generate weekly report (for cron job - no user context, so no school filter needed for auto-generation)
exports.autoGenerateWeeklyReport = async () => {
    try {
        const weekEnd = new Date();
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        weekStart.setUTCHours(0, 0, 0, 0);
        weekEnd.setUTCHours(23, 59, 59, 999);
        
        // For auto-generation, we need to generate reports per school
        const schools = await mongoose.model('School').find({ isActive: true });
        
        for (const school of schools) {
            const records = await FeedingRecord.find({
                school: school._id,
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
            
            console.log(`Auto-generated weekly report for school ${school.name}: ${Object.keys(grouped).length} items`);
        }
        
        return { success: true };
    } catch (error) {
        console.error("Auto-generate report error:", error);
        return { success: false, error: error.message };
    }
};