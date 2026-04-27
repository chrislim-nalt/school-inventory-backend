const LaboratoryItem = require("../models/LaboratoryItem");

// Get all laboratory items (filtered by school)
exports.getLaboratoryItems = async (req, res) => {
    try {
        const items = await LaboratoryItem.find({ school: req.user.schoolId })
            .sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        console.error("Get lab items error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get single laboratory item by ID
exports.getLaboratoryItemById = async (req, res) => {
    try {
        const item = await LaboratoryItem.findOne({ 
            _id: req.params.id, 
            school: req.user.schoolId 
        });
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }
        res.json(item);
    } catch (error) {
        console.error("Get lab item by ID error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Create laboratory item (automatically adds school ID)
exports.createLaboratoryItem = async (req, res) => {
    try {
        console.log("Creating lab item for school:", req.user.schoolId);
        
        const item = new LaboratoryItem({
            name: req.body.name,
            itemType: req.body.itemType || "EQUIPMENT",
            quantity: req.body.quantity || 1,
            unit: req.body.unit || "pcs",
            condition: req.body.condition || "Good",
            storageLocation: req.body.storageLocation || "Laboratory",
            isHazardous: req.body.isHazardous || false,
            expirationDate: req.body.expirationDate || null,
            responsiblePerson: req.body.responsiblePerson || "",
            dateReceived: req.body.dateReceived || new Date(),
            minStockLevel: req.body.minStockLevel || 1,
            notes: req.body.notes || "",
            school: req.user.schoolId
        });
        
        await item.save();
        res.status(201).json(item);
    } catch (error) {
        console.error("Create lab item error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Update laboratory item (verify school ownership)
exports.updateLaboratoryItem = async (req, res) => {
    try {
        const item = await LaboratoryItem.findOneAndUpdate(
            { _id: req.params.id, school: req.user.schoolId },
            req.body,
            { new: true }
        );
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }
        res.json(item);
    } catch (error) {
        console.error("Update lab item error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Delete laboratory item (verify school ownership)
exports.deleteLaboratoryItem = async (req, res) => {
    try {
        const item = await LaboratoryItem.findOneAndDelete({ 
            _id: req.params.id, 
            school: req.user.schoolId 
        });
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }
        res.json({ message: "Item deleted successfully" });
    } catch (error) {
        console.error("Delete lab item error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get expired chemicals (filtered by school)
exports.getExpiredChemicals = async (req, res) => {
    try {
        const expired = await LaboratoryItem.find({
            school: req.user.schoolId,
            itemType: "CHEMICAL",
            expirationDate: { $lt: new Date() }
        });
        res.json(expired);
    } catch (error) {
        console.error("Get expired chemicals error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get low stock lab items (filtered by school)
exports.getLowStockLabItems = async (req, res) => {
    try {
        const lowStock = await LaboratoryItem.find({
            school: req.user.schoolId,
            $expr: { $lte: ["$quantity", "$minStockLevel"] }
        });
        res.json(lowStock);
    } catch (error) {
        console.error("Get low stock lab items error:", error);
        res.status(500).json({ message: error.message });
    }
};