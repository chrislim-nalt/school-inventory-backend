// Helper to add school filter to any query
const addSchoolFilter = (req, query = {}) => {
    if (req.user && req.user.schoolId) {
      return { ...query, school: req.user.schoolId };
    }
    return query;
  };
  
  // Helper to get school ID from request
  const getSchoolId = (req) => {
    return req.user?.schoolId || null;
  };
  
  // Helper to verify ownership
  const verifyOwnership = async (Model, id, schoolId) => {
    const document = await Model.findOne({ _id: id, school: schoolId });
    return !!document;
  };
  
  module.exports = { addSchoolFilter, getSchoolId, verifyOwnership };