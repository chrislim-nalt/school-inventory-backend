const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { 
  register, 
  verifyOtp, 
  resendOtp, 
  login, 
  verifyLoginOtp,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  forgotSchoolCode
} = require("../controllers/authController");

// Public routes
router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/verify-login-otp", verifyLoginOtp);

// Password reset routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

// School code recovery
router.post("/forgot-school-code", forgotSchoolCode);

// Protected routes
router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);
router.put("/change-password", auth, changePassword);

module.exports = router;