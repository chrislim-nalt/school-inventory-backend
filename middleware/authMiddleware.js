const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.header("Authorization");
  console.log("Auth middleware - Token:", token ? "Present" : "Missing");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded user:", { 
      id: decoded.id, 
      email: decoded.email,
      schoolId: decoded.schoolId,
      role: decoded.role 
    });
    
    // Attach user info to request
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
    console.error("Token verification error:", error.message);
    res.status(401).json({ message: "Token is not valid" });
  }
};