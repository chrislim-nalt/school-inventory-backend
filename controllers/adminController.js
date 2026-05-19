const User = require("../models/User");
const School = require("../models/School");
const Subscription = require("../models/Subscription");
const bcrypt = require("bcryptjs");
const { sendSchoolWelcomeEmail } = require("../services/emailService");

// Helper function to generate strong password
function generateStrongPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Get all schools
exports.getSchools = async (req, res) => {
    try {
        const { status, search } = req.query;
        let filter = {};
        if (status && status !== "all") filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { schoolCode: { $regex: search, $options: 'i' } }
            ];
        }
        const schools = await School.find(filter).sort({ createdAt: -1 });
        
        const schoolsWithSubscriptions = await Promise.all(schools.map(async (school) => {
            const subscription = await Subscription.findOne({ school: school._id });
            return { ...school.toObject(), subscription };
        }));
        
        res.json(schoolsWithSubscriptions);
    } catch (error) {
        console.error("Get schools error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get single school
exports.getSchoolById = async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) return res.status(404).json({ message: "School not found" });
        
        const subscription = await Subscription.findOne({ school: school._id });
        const users = await User.find({ school: school._id }).select("-password");
        
        res.json({ school, subscription, users });
    } catch (error) {
        console.error("Get school error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Register new school
exports.registerSchool = async (req, res) => {
    try {
        const { name, email, phone, address, adminName, adminEmail, adminPassword, plan } = req.body;
        
        console.log("Registering school:", name);
        
        const existingSchool = await School.findOne({ $or: [{ name }, { email }] });
        if (existingSchool) {
            return res.status(400).json({ message: "School already exists" });
        }
        
        const school = new School({ 
            name, 
            email, 
            phone, 
            address, 
            status: "active" 
        });
        await school.save();
        
        console.log("School created - Code:", school.schoolCode);
        
        const finalPassword = adminPassword || generateStrongPassword();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(finalPassword, salt);
        
        const user = new User({
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            school: school._id,
            role: "admin",
            isActive: true,
            isVerified: true
        });
        await user.save();
        
        let endDate = null;
        if (plan === "monthly") {
            endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        } else if (plan === "yearly") {
            endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        } else if (plan === "free_trial") {
            endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        }
        
        const subscription = new Subscription({
            school: school._id,
            plan: plan || "free_trial",
            status: "active",
            startDate: new Date(),
            endDate: endDate
        });
        await subscription.save();
        
        const credentials = {
            schoolName: school.name,
            schoolCode: school.schoolCode,
            adminName: adminName,
            adminEmail: adminEmail,
            adminPassword: finalPassword,
            loginUrl: process.env.FRONTEND_URL || "http://localhost:5173"
        };
        
        let emailSent = false;
        try {
            emailSent = await sendSchoolWelcomeEmail(adminEmail, adminName, school.name, school.schoolCode, finalPassword);
        } catch (emailError) {
            console.log("Email error:", emailError.message);
        }
        
        res.status(201).json({
            success: true,
            message: "School registered successfully!",
            credentials: credentials,
            emailSent: emailSent,
            school: { id: school._id, name: school.name, code: school.schoolCode },
            user: { email: adminEmail, password: finalPassword }
        });
        
    } catch (error) {
        console.error("Register school error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Approve school
exports.approveSchool = async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) return res.status(404).json({ message: "School not found" });
        
        school.status = "active";
        await school.save();
        await User.updateMany({ school: school._id }, { isActive: true });
        
        res.json({ message: "School approved successfully", school });
    } catch (error) {
        console.error("Approve school error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Suspend school
exports.suspendSchool = async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) return res.status(404).json({ message: "School not found" });
        
        school.status = "suspended";
        await school.save();
        await User.updateMany({ school: school._id }, { isActive: false });
        
        res.json({ message: "School suspended successfully", school });
    } catch (error) {
        console.error("Suspend school error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Delete school
exports.deleteSchool = async (req, res) => {
    try {
        await User.deleteMany({ school: req.params.id });
        await Subscription.deleteOne({ school: req.params.id });
        await School.deleteOne({ _id: req.params.id });
        
        res.json({ message: "School deleted permanently" });
    } catch (error) {
        console.error("Delete school error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Update subscription
exports.updateSubscription = async (req, res) => {
    try {
        let subscription = await Subscription.findOne({ school: req.params.id });
        if (!subscription) {
            subscription = new Subscription({ school: req.params.id });
        }
        
        subscription.plan = req.body.plan;
        subscription.status = "active";
        
        if (req.body.plan === "lifetime") {
            subscription.endDate = null;
        } else if (req.body.plan === "monthly") {
            subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        } else if (req.body.plan === "yearly") {
            subscription.endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        } else {
            subscription.endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        }
        
        await subscription.save();
        res.json({ message: "Subscription updated", subscription });
    } catch (error) {
        console.error("Update subscription error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password").populate("school", "name schoolCode");
        res.json(users);
    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({ message: error.message });
    }
};

// ========== NEW: Create User (Super Admin) ==========
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, schoolId, role } = req.body;
        
        // Validate required fields
        if (!name || !email || !schoolId) {
            return res.status(400).json({ 
                message: "Please provide name, email, and school" 
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ 
                message: "User with this email already exists" 
            });
        }
        
        // Check if school exists
        const school = await School.findById(schoolId);
        if (!school) {
            return res.status(404).json({ 
                message: "School not found" 
            });
        }
        
        // Generate password if not provided
        const finalPassword = password || generateStrongPassword();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(finalPassword, salt);
        
        // Create user
        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            school: schoolId,
            role: role || "staff",
            isActive: true,
            isVerified: true
        });
        
        await user.save();
        
        // Return user data (without password)
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.status(201).json({
            success: true,
            message: "User created successfully!",
            user: userResponse,
            credentials: {
                name: user.name,
                email: user.email,
                password: finalPassword,
                school: school.name,
                schoolCode: school.schoolCode,
                role: user.role,
                loginUrl: process.env.FRONTEND_URL || "http://localhost:5173"
            }
        });
        
    } catch (error) {
        console.error("Create user error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Update user
exports.updateUserRole = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        
        if (req.body.role) user.role = req.body.role;
        if (req.body.isActive !== undefined) user.isActive = req.body.isActive;
        await user.save();
        
        const updatedUser = await User.findById(req.params.id)
            .select("-password")
            .populate("school", "name schoolCode");
        
        res.json({ 
            success: true,
            message: "User updated successfully", 
            user: updatedUser 
        });
    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Prevent deleting the last admin of a school
        const schoolAdminCount = await User.countDocuments({ 
            school: user.school, 
            role: "admin",
            isActive: true
        });
        
        if (user.role === "admin" && schoolAdminCount === 1) {
            return res.status(400).json({ 
                message: "Cannot delete the last admin of this school. Please assign another admin first." 
            });
        }
        
        await User.deleteOne({ _id: req.params.id });
        
        res.json({ 
            success: true,
            message: `User "${user.name}" deleted successfully` 
        });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        const totalSchools = await School.countDocuments();
        const activeSchools = await School.countDocuments({ status: "active" });
        const pendingSchools = await School.countDocuments({ status: "pending" });
        const totalUsers = await User.countDocuments();
        
        const subscriptions = await Subscription.aggregate([
            { $group: { _id: "$plan", count: { $sum: 1 } } }
        ]);
        
        const recentSchools = await School.find().sort({ createdAt: -1 }).limit(5);
        
        res.json({
            schools: { total: totalSchools, active: activeSchools, pending: pendingSchools },
            users: { total: totalUsers },
            subscriptions,
            recentSchools
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Reset user password and return new credentials for sharing
exports.resetUserPassword = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId).populate("school", "name schoolCode");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Generate new strong password
        const newPassword = generateStrongPassword();
        
        // Hash and save new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;
        await user.save();
        
        // Return the new credentials
        res.json({
            success: true,
            message: "Password reset successfully!",
            credentials: {
                schoolName: user.school?.name || "N/A",
                schoolCode: user.school?.schoolCode || "N/A",
                name: user.name,
                email: user.email,
                password: newPassword,
                role: user.role,
                loginUrl: process.env.FRONTEND_URL || "http://localhost:5173"
            }
        });
        
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: error.message });
    }
};