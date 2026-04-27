const CleaningSupply = require("../models/CleaningSupply");

// Get all cleaning supplies (filtered by school)
exports.getCleaningSupplies = async (req, res) => {
  try {
    const supplies = await CleaningSupply.find({ school: req.user.schoolId })
      .sort({ createdAt: -1 });
    res.json(supplies);
  } catch (error) {
    console.error("Get supplies error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get single cleaning supply by ID
exports.getCleaningSupplyById = async (req, res) => {
  try {
    const supply = await CleaningSupply.findOne({ 
      _id: req.params.id, 
      school: req.user.schoolId 
    });
    if (!supply) {
      return res.status(404).json({ message: "Supply not found" });
    }
    res.json(supply);
  } catch (error) {
    console.error("Get supply by ID error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create cleaning supply (automatically adds school ID)
exports.createCleaningSupply = async (req, res) => {
  try {
    console.log("Creating cleaning supply for school:", req.user.schoolId);
    
    const supply = new CleaningSupply({
      name: req.body.name,
      quantity: req.body.quantity || 0,
      unit: req.body.unit || "pcs",
      minStockLevel: req.body.minStockLevel || 10,
      storageLocation: req.body.storageLocation || "Storage Room",
      responsiblePerson: req.body.responsiblePerson || "",
      lastRestockedDate: req.body.lastRestockedDate || new Date(),
      unitPrice: req.body.unitPrice || 0,
      supplier: req.body.supplier || "",
      notes: req.body.notes || "",
      school: req.user.schoolId
    });
    
    await supply.save();
    res.status(201).json(supply);
  } catch (error) {
    console.error("Create supply error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update cleaning supply (verify school ownership)
exports.updateCleaningSupply = async (req, res) => {
  try {
    const supply = await CleaningSupply.findOneAndUpdate(
      { _id: req.params.id, school: req.user.schoolId },
      req.body,
      { new: true }
    );
    if (!supply) {
      return res.status(404).json({ message: "Supply not found" });
    }
    res.json(supply);
  } catch (error) {
    console.error("Update supply error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete cleaning supply (verify school ownership)
exports.deleteCleaningSupply = async (req, res) => {
  try {
    const supply = await CleaningSupply.findOneAndDelete({ 
      _id: req.params.id, 
      school: req.user.schoolId 
    });
    if (!supply) {
      return res.status(404).json({ message: "Supply not found" });
    }
    res.json({ message: "Supply deleted successfully" });
  } catch (error) {
    console.error("Delete supply error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get low stock supplies (filtered by school)
exports.getLowStockSupplies = async (req, res) => {
  try {
    const lowStock = await CleaningSupply.find({
      school: req.user.schoolId,
      $expr: { $lte: ["$quantity", "$minStockLevel"] }
    });
    res.json(lowStock);
  } catch (error) {
    console.error("Get low stock supplies error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update stock quantity (verify school ownership)
exports.updateStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    
    const supply = await CleaningSupply.findOneAndUpdate(
      { _id: req.params.id, school: req.user.schoolId },
      { quantity, lastRestockedDate: new Date() },
      { new: true }
    );
    if (!supply) {
      return res.status(404).json({ message: "Supply not found" });
    }
    res.json(supply);
  } catch (error) {
    console.error("Update stock error:", error);
    res.status(500).json({ message: error.message });
  }
};