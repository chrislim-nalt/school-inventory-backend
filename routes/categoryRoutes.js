const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require("../controllers/categoryController");

router.get("/", auth, getCategories);
router.get("/:id", auth, getCategoryById);
router.post("/", auth, createCategory);
router.put("/:id", auth, updateCategory);
router.delete("/:id", auth, deleteCategory);

module.exports = router;