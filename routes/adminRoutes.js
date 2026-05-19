const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const adminController = require("../controllers/adminController");

// Super admin middleware
const isSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "superadmin") {
        return res.status(403).json({ message: "Access denied. Super admin only." });
    }
    next();
};

// Apply middleware to all routes
router.use(auth, isSuperAdmin);

// Dashboard
router.get("/dashboard/stats", adminController.getDashboardStats);

// Schools
router.get("/schools", adminController.getSchools);
router.get("/schools/:id", adminController.getSchoolById);
router.post("/schools/register", adminController.registerSchool);
router.put("/schools/:id/approve", adminController.approveSchool);
router.put("/schools/:id/suspend", adminController.suspendSchool);
router.delete("/schools/:id", adminController.deleteSchool);

// Subscriptions
router.put("/subscriptions/:id", adminController.updateSubscription);

// Users
router.get("/users", adminController.getUsers);
router.post("/users", adminController.createUser);  // NEW: Create user route
router.put("/users/:id", adminController.updateUserRole);
router.delete("/users/:id", adminController.deleteUser);

// Reset user password and get new credentials (for Share button)
router.post("/users/:userId/reset-password", adminController.resetUserPassword);

module.exports = router;