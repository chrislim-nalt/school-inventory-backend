const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  createProjectedNeed,
  getProjectedNeeds,
  updateProjectedNeed,
  deleteProjectedNeed,
} = require("../controllers/projectedNeedController");

router.post("/", auth, createProjectedNeed);
router.get("/", auth, getProjectedNeeds);
router.put("/:id", auth, updateProjectedNeed);
router.delete("/:id", auth, deleteProjectedNeed);

module.exports = router;