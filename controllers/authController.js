const User = require("../models/User");
const School = require("../models/School");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { sendOTP, sendPasswordResetOTP, sendSchoolCodeRecovery } = require("../services/emailService");

// Register - Step 1: Check school and send OTP with school info
exports.register = async (req, res) => {
    try {
        const { name, email, password, schoolCode, schoolName } = req.body;
        console.log("Register attempt:", { name, email, schoolCode, schoolName });
        
        let school = null;
        
        if (schoolCode) {
            school = await School.findOne({ schoolCode: schoolCode.toUpperCase() });
            if (!school) {
                return res.status(404).json({ message: "School not found. Please check your school code." });
            }
            if (!school.isActive) {
                return res.status(403).json({ message: "This school account is inactive." });
            }
        } else if (schoolName) {
            const existingSchool = await School.findOne({ name: schoolName });
            if (existingSchool) {
                return res.status(400).json({ message: "School already registered. Please use your school code to join." });
            }
            
            school = new School({
                name: schoolName,
                email: email,
                isActive: true,
            });
            await school.save();
            console.log("✅ New school created:", school.name, "| Code:", school.schoolCode);
        } else {
            return res.status(400).json({ message: "Please provide either school code or school name" });
        }
        
        const existingUser = await User.findOne({ email, school: school._id });
        if (existingUser) {
            return res.status(400).json({ message: "User already registered in this school" });
        }
        
        const userCount = await User.countDocuments({ school: school._id });
        const role = userCount === 0 ? "admin" : "staff";
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const user = new User({
            name,
            email,
            password: hashedPassword,
            school: school._id,
            role,
            isVerified: false,
        });
        await user.save();
        console.log("✅ User created:", email, "| Role:", role);
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60000);
        await user.save();
        
        // Send OTP with school code and name
        const emailSent = await sendOTP(email, otp, name, school.schoolCode, school.name);
        if (!emailSent) {
            return res.status(500).json({ message: "Failed to send verification email" });
        }
        
        console.log("📧 Welcome email with school code sent to:", email);
        res.status(201).json({ 
            message: "Verification code sent to your email",
            schoolCode: school.schoolCode,
            schoolName: school.name,
            role: role
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

// Verify OTP - Step 2
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        console.log("Verifying OTP for:", email);
        
        const user = await User.findOne({ email }).populate("school", "name schoolCode");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        if (user.isVerified) {
            return res.status(400).json({ message: "Email already verified" });
        }
        
        if (!user.otp || user.otp !== otp) {
            return res.status(401).json({ message: "Invalid verification code" });
        }
        
        if (new Date() > user.otpExpires) {
            return res.status(401).json({ message: "Code expired. Please register again." });
        }
        
        user.isVerified = true;
        user.otp = null;
        user.otpExpires = null;
        await user.save();
        
        console.log("✅ User verified:", email);
        res.json({ 
            message: "Email verified successfully! Please login.",
            schoolName: user.school.name,
            schoolCode: user.school.schoolCode,
            role: user.role
        });
    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

// Resend OTP - Updated with school info
exports.resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        console.log("Resending OTP for:", email);
        
        const user = await User.findOne({ email }).populate("school");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        if (user.isVerified) {
            return res.status(400).json({ message: "Email already verified" });
        }
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60000);
        await user.save();
        
        // Send OTP with school info
        await sendOTP(email, otp, user.name, user.school?.schoolCode, user.school?.name);
        
        console.log("📧 OTP resent to:", email);
        res.json({ message: "New verification code sent" });
    } catch (error) {
        console.error("Resend error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

// Login - Step 1
exports.login = async (req, res) => {
    try {
        const { email, password, schoolCode } = req.body;
        console.log("Login attempt for:", email, "School:", schoolCode);
        
        const school = await School.findOne({ schoolCode: schoolCode.toUpperCase() });
        if (!school) {
            return res.status(404).json({ message: "School not found. Please check your school code." });
        }
        
        if (!school.isActive) {
            return res.status(403).json({ message: "This school account is inactive." });
        }
        
        const user = await User.findOne({ email, school: school._id });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password for this school" });
        }
        
        if (!user.isVerified) {
            return res.status(401).json({ message: "Please verify your email first" });
        }
        
        if (!user.isActive) {
            return res.status(403).json({ message: "Your account has been deactivated" });
        }
        
        if (school.subscription.endDate && new Date() > school.subscription.endDate) {
            return res.status(403).json({ message: "School subscription has expired. Please renew." });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60000);
        await user.save();
        
        // Send login OTP with school name
        await sendOTP(email, otp, user.name, null, school.name);
        
        console.log("📧 Login OTP sent to:", email);
        res.json({ 
            message: "Verification code sent", 
            email: email,
            schoolName: school.name,
            schoolCode: school.schoolCode
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

// Verify Login OTP - Step 2
exports.verifyLoginOtp = async (req, res) => {
    try {
        const { email, otp, schoolCode } = req.body;
        console.log("Verifying login OTP for:", email);
        
        const school = await School.findOne({ schoolCode: schoolCode.toUpperCase() });
        if (!school) {
            return res.status(404).json({ message: "School not found" });
        }
        
        const user = await User.findOne({ email, school: school._id });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        if (!user.otp || user.otp !== otp) {
            return res.status(401).json({ message: "Invalid verification code" });
        }
        
        if (new Date() > user.otpExpires) {
            return res.status(401).json({ message: "Code expired. Please login again." });
        }
        
        user.otp = null;
        user.otpExpires = null;
        user.lastLogin = new Date();
        await user.save();
        
        const token = jwt.sign(
            { 
                id: user._id, 
                email: user.email, 
                name: user.name,
                role: user.role,
                schoolId: school._id,
                schoolCode: school.schoolCode,
                schoolName: school.name
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );
        
        console.log("✅ User logged in:", email, "| School:", school.name);
        res.json({ 
            message: "Login successful", 
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                school: {
                    id: school._id,
                    name: school.name,
                    code: school.schoolCode
                }
            }
        });
    } catch (error) {
        console.error("Verify login OTP error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

// Forgot Password - Step 1
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        console.log("Password reset requested for:", email);
        
        const user = await User.findOne({ email }).populate("school");
        if (!user) {
            return res.status(404).json({ message: "No account found with this email" });
        }
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60000);
        await user.save();
        
        // Send password reset OTP with school name
        const emailSent = await sendPasswordResetOTP(email, otp, user.name, user.school?.name);
        if (!emailSent) {
            return res.status(500).json({ message: "Failed to send reset code" });
        }
        
        console.log("📧 Password reset OTP sent to:", email);
        res.json({ 
            message: "Password reset code sent to your email",
            email: email
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

// Verify Password Reset OTP - Step 2
exports.verifyResetOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        console.log("Verifying password reset OTP for:", email);
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        if (!user.otp || user.otp !== otp) {
            return res.status(401).json({ message: "Invalid verification code" });
        }
        
        if (new Date() > user.otpExpires) {
            return res.status(401).json({ message: "Code expired. Please request again." });
        }
        
        console.log("✅ Password reset OTP verified for:", email);
        res.json({ 
            message: "Code verified successfully. You can now reset your password.",
            verified: true
        });
    } catch (error) {
        console.error("Verify reset OTP error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

// Reset Password - Step 3
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        console.log("Resetting password for:", email);
        
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        if (!user.otp || user.otp !== otp) {
            return res.status(401).json({ message: "Invalid verification code" });
        }
        
        if (new Date() > user.otpExpires) {
            return res.status(401).json({ message: "Code expired. Please request again." });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        user.password = hashedPassword;
        user.otp = null;
        user.otpExpires = null;
        await user.save();
        
        console.log("✅ Password reset successfully for:", email);
        res.json({ message: "Password reset successfully! Please login with your new password." });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

// Forgot School Code
exports.forgotSchoolCode = async (req, res) => {
    try {
        const { email } = req.body;
        console.log("School code recovery requested for:", email);
        
        const user = await User.findOne({ email }).populate("school");
        if (!user) {
            return res.status(404).json({ message: "No account found with this email" });
        }
        
        const emailSent = await sendSchoolCodeRecovery(email, user.school.name, user.school.schoolCode);
        
        if (!emailSent) {
            return res.status(500).json({ message: "Failed to send email" });
        }
        
        console.log("📧 School code sent to:", email);
        res.json({ message: "School code sent to your email" });
    } catch (error) {
        console.error("Forgot school code error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password -otp -otpExpires')
            .populate("school", "name schoolCode email phone address subscription");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ 
                email, 
                school: user.school,
                _id: { $ne: user._id }
            });
            if (existingUser) {
                return res.status(400).json({ message: "Email already in use" });
            }
            user.email = email;
        }
        
        if (name) user.name = name;
        await user.save();
        
        res.json({ 
            message: "Profile updated successfully", 
            user: { id: user._id, name: user.name, email: user.email, role: user.role } 
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Change password (logged in user)
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current password and new password are required" });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        user.password = hashedPassword;
        await user.save();
        
        res.json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};