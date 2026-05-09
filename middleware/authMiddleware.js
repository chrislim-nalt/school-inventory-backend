const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const token = req.header("Authorization");
    
    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role,
            schoolId: decoded.schoolId,
            schoolCode: decoded.schoolCode,
            schoolName: decoded.schoolName
        };
        next();
    } catch (error) {
        res.status(401).json({ message: "Token is not valid" });
    }
};