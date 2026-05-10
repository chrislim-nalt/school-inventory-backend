const Category = require("../models/Category");

// Get all categories (filtered by school - super admin sees all)
exports.getCategories = async (req, res) => {
  try {
    let filter = {};
    
    // If user is super admin, show all categories (no school filter)
    if (req.user.role !== "superadmin") {
      filter.school = req.user.schoolId;
    }
    
    const categories = await Category.find(filter).sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get single category by ID
exports.getCategoryById = async (req, res) => {
  try {
    let filter = { _id: req.params.id };
    
    // If user is not super admin, filter by school
    if (req.user.role !== "superadmin") {
      filter.school = req.user.schoolId;
    }
    
    const category = await Category.findOne(filter);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    console.error("Get category by ID error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, categoryType, icon } = req.body;
    
    // Super admin cannot create categories (they belong to schools)
    if (req.user.role === "superadmin") {
      return res.status(400).json({ message: "Super admin cannot create categories. Please login as a school admin." });
    }
    
    // Check if schoolId exists
    if (!req.user.schoolId) {
      return res.status(400).json({ message: "School not found. Please login again." });
    }
    
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

// Update category
exports.updateCategory = async (req, res) => {
  try {
    let filter = { _id: req.params.id };
    
    // If user is not super admin, filter by school
    if (req.user.role !== "superadmin") {
      filter.school = req.user.schoolId;
    }
    
    const category = await Category.findOneAndUpdate(
      filter,
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

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    let filter = { _id: req.params.id };
    
    // If user is not super admin, filter by school
    if (req.user.role !== "superadmin") {
      filter.school = req.user.schoolId;
    }
    
    const category = await Category.findOneAndDelete(filter);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};