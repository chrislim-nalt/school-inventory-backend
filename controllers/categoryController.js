const Category = require("../models/Category");

// Get all categories (filtered by school)
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ school: req.user.schoolId })
      .sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ADD THIS MISSING FUNCTION - Get single category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findOne({ 
      _id: req.params.id, 
      school: req.user.schoolId 
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    console.error("Get category by ID error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create category (automatically adds school ID)
exports.createCategory = async (req, res) => {
  try {
    const { name, description, categoryType, icon } = req.body;
    
    const existingCategory = await Category.findOne({ 
      name, 
      school: req.user.schoolId 
    });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists in your school" });
    }
    
    const category = new Category({
      name,
      description: description || "",
      categoryType: categoryType || "OTHER",
      icon: icon || "📦",
      school: req.user.schoolId
    });
    
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update category (verify school ownership)
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, school: req.user.schoolId },
      req.body,
      { new: true }
    );
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete category (verify school ownership)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ 
      _id: req.params.id, 
      school: req.user.schoolId 
    });
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};