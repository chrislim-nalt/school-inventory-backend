const Item = require("../models/Item");

// Get all items (filtered by school)
exports.getItems = async (req, res) => {
  try {
    const items = await Item.find({ school: req.user.schoolId })
      .populate("category", "name")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error("Get items error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ADD THIS MISSING FUNCTION - Get single item by ID
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findOne({ 
      _id: req.params.id, 
      school: req.user.schoolId 
    }).populate("category", "name");
    
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json(item);
  } catch (error) {
    console.error("Get item by ID error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create item (automatically adds school ID)
exports.createItem = async (req, res) => {
  try {
    const item = new Item({
      ...req.body,
      school: req.user.schoolId
    });
    await item.save();
    const populatedItem = await Item.findById(item._id).populate("category", "name");
    res.status(201).json(populatedItem);
  } catch (error) {
    console.error("Create item error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update item (verify school ownership)
exports.updateItem = async (req, res) => {
  try {
    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, school: req.user.schoolId },
      req.body,
      { new: true }
    ).populate("category", "name");
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    console.error("Update item error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete item (verify school ownership)
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({ 
      _id: req.params.id, 
      school: req.user.schoolId 
    });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Delete item error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get items by category (filtered by school)
exports.getItemsByCategory = async (req, res) => {
  try {
    const items = await Item.find({ 
      category: req.params.categoryId,
      school: req.user.schoolId 
    }).populate("category", "name");
    res.json(items);
  } catch (error) {
    console.error("Get items by category error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};