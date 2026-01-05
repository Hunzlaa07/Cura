const jwt = require('jsonwebtoken');
const db = require('../src/config/database');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const [users] = await db.query(
      'SELECT id, email, full_name, user_type FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = users[0];
    
    // If user is an applicant, also get their applicant_profile id
    if (req.user.user_type === 'applicant' || req.user.user_type === 'case_study_applicant') {
      const [profiles] = await db.query(
        'SELECT id FROM applicant_profiles WHERE user_id = ?',
        [req.user.id]
      );
      if (profiles && profiles.length > 0) {
        req.user.applicantId = profiles[0].id;
      }
    }
    
    next();

  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};