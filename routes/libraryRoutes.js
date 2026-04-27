const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
  getBooksBySubject,
  getBooksByType,
} = require("../controllers/libraryController");

router.get("/", auth, getBooks);
router.get("/subject/:subject", auth, getBooksBySubject);
router.get("/type/:bookType", auth, getBooksByType);
router.post("/", auth, createBook);
router.put("/:id", auth, updateBook);
router.delete("/:id", auth, deleteBook);

module.exports = router;