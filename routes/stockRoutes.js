const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const stockController = require("../controllers/stockController");

router.get("/borrowed", auth, stockController.getBorrowedItems);
router.get("/", auth, stockController.getTransactions);
router.post("/", auth, stockController.createTransaction);
router.get("/item/:itemId", auth, stockController.getItemTransactions);
router.put("/:id/return", auth, stockController.returnBorrowedItem);
router.put("/:id", auth, stockController.updateTransaction);
router.delete("/:id", auth, stockController.deleteTransaction);

module.exports = router;