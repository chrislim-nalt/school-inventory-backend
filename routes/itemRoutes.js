const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getItemsByCategory
} = require("../controllers/itemController");

router.get("/", auth, getItems);
router.get("/:id", auth, getItemById);
router.get("/category/:categoryId", auth, getItemsByCategory);
router.post("/", auth, createItem);
router.put("/:id", auth, updateItem);
router.delete("/:id", auth, deleteItem);

module.exports = router;